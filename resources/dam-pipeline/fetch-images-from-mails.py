import imaplib
import email
import zipfile
import hashlib
import shutil
import os
import sys

from email.header import decode_header
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR / ".env")

# =========================================================
# Konfiguration
# =========================================================

IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.example.org")
IMAP_PORT = int(os.getenv("IMAP_PORT", "993"))

USERNAME = os.getenv("IMAP_USERNAME")
PASSWORD = os.getenv("IMAP_PASSWORD")

MAILBOX = os.getenv("IMAP_MAILBOX", "INBOX")

# IMAP Datumsformat:
# 01-Jan-2026
SINCE_DATE = os.getenv("SINCE_DATE", "01-Jan-2026")

# Zielverzeichnis
BASE_DIR = Path(os.getenv("BASE_DIR", "mail_import"))

# erlaubte Bildtypen
VALID_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".heic",
    ".tif",
    ".tiff",
}

# maximale ZIP Größe (Schutz gegen Zip Bombs)
MAX_ZIP_SIZE_MB = int(os.getenv("MAX_ZIP_SIZE_MB", "500"))

if not USERNAME or not PASSWORD:
    print(
        "Fehler: IMAP_USERNAME und IMAP_PASSWORD müssen in .env gesetzt sein.",
        file=sys.stderr,
    )
    sys.exit(1)

# =========================================================
# Verzeichnisse
# =========================================================

RAW_DIR = BASE_DIR / "raw"
ZIP_DIR = BASE_DIR / "zip"
EXTRACT_DIR = BASE_DIR / "extracted"
IMAGE_DIR = BASE_DIR / "images"
REJECT_DIR = BASE_DIR / "rejected"

for d in [
    RAW_DIR,
    ZIP_DIR,
    EXTRACT_DIR,
    IMAGE_DIR,
    REJECT_DIR,
]:
    d.mkdir(parents=True, exist_ok=True)

# =========================================================
# Hilfsfunktionen
# =========================================================


def decode_mime_header(value):
    """
    MIME Header sauber dekodieren
    """
    if not value:
        return ""

    decoded_parts = decode_header(value)

    result = []

    for text, encoding in decoded_parts:

        if isinstance(text, bytes):
            result.append(
                text.decode(
                    encoding or "utf-8",
                    errors="ignore"
                )
            )
        else:
            result.append(text)

    return "".join(result)


def safe_filename(name):
    """
    Dateinamen bereinigen
    """
    invalid = '<>:"/\\|?*'

    for c in invalid:
        name = name.replace(c, "_")

    return name.strip()


def unique_path(path: Path):
    """
    Kollisionen vermeiden
    """
    if not path.exists():
        return path

    counter = 1

    while True:

        new_path = path.with_name(
            f"{path.stem}_{counter}{path.suffix}"
        )

        if not new_path.exists():
            return new_path

        counter += 1


def sha256sum(path: Path):
    """
    Datei Hash berechnen
    """
    h = hashlib.sha256()

    with open(path, "rb") as f:

        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)

    return h.hexdigest()


def is_safe_zip_member(base_dir: Path, member_name: str):
    """
    Schutz gegen Zip Slip
    """
    target_path = (base_dir / member_name).resolve()

    return str(target_path).startswith(
        str(base_dir.resolve())
    )


def save_image_if_valid(src: Path):
    """
    Nur gültige Bilddateien übernehmen
    """

    if src.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
        return

    target = unique_path(
        IMAGE_DIR / src.name
    )

    shutil.copy2(src, target)

    print(f"  Bild gespeichert: {target}")


# =========================================================
# IMAP Verbindung
# =========================================================

print("Verbinde IMAP ...")

mail = imaplib.IMAP4_SSL(
    IMAP_SERVER,
    IMAP_PORT
)

mail.login(
    USERNAME,
    PASSWORD
)

mail.select(MAILBOX)

# =========================================================
# Mails suchen
# =========================================================

status, messages = mail.search(
    None,
    f'(SINCE "{SINCE_DATE}")'
)

mail_ids = messages[0].split()

print(f"{len(mail_ids)} Mails gefunden")

# =========================================================
# Verarbeitung
# =========================================================

for mail_id in mail_ids:

    print("\n=================================================")

    status, msg_data = mail.fetch(
        mail_id,
        "(RFC822)"
    )

    raw_email = msg_data[0][1]

    msg = email.message_from_bytes(raw_email)

    subject = decode_mime_header(
        msg.get("Subject")
    )

    sender = decode_mime_header(
        msg.get("From")
    )

    date_str = msg.get("Date")

    print(f"Betreff : {subject}")
    print(f"Von      : {sender}")
    print(f"Datum    : {date_str}")

    # eigener Job-Ordner pro Mail

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    job_dir = BASE_DIR / f"job_{timestamp}_{mail_id.decode()}"

    job_dir.mkdir(exist_ok=True)

    # -----------------------------------------------------
    # Attachments
    # -----------------------------------------------------

    for part in msg.walk():

        content_disposition = part.get(
            "Content-Disposition"
        )

        if not content_disposition:
            continue

        filename = part.get_filename()

        if not filename:
            continue

        filename = decode_mime_header(filename)

        filename = safe_filename(filename)

        payload = part.get_payload(decode=True)

        if not payload:
            continue

        attachment_path = unique_path(
            RAW_DIR / filename
        )

        with open(attachment_path, "wb") as f:
            f.write(payload)

        print(f"\nAttachment gespeichert:")
        print(f"  {attachment_path}")

        # -------------------------------------------------
        # Normale Bilder direkt übernehmen
        # -------------------------------------------------

        if attachment_path.suffix.lower() in VALID_IMAGE_EXTENSIONS:

            save_image_if_valid(attachment_path)

        # -------------------------------------------------
        # ZIP Dateien
        # -------------------------------------------------

        elif attachment_path.suffix.lower() == ".zip":

            zip_target = unique_path(
                ZIP_DIR / attachment_path.name
            )

            shutil.copy2(
                attachment_path,
                zip_target
            )

            print("  ZIP erkannt")

            # ZIP Größe prüfen

            size_mb = zip_target.stat().st_size / 1024 / 1024

            if size_mb > MAX_ZIP_SIZE_MB:

                print(
                    f"  ZIP zu groß ({size_mb:.1f} MB)"
                )

                shutil.move(
                    zip_target,
                    REJECT_DIR / zip_target.name
                )

                continue

            extract_dir = (
                EXTRACT_DIR / zip_target.stem
            )

            extract_dir.mkdir(
                parents=True,
                exist_ok=True
            )

            try:

                with zipfile.ZipFile(
                    zip_target,
                    "r"
                ) as zip_ref:

                    # Sicherheitsprüfung

                    for member in zip_ref.namelist():

                        if not is_safe_zip_member(
                            extract_dir,
                            member
                        ):

                            raise Exception(
                                f"Unsicherer ZIP Pfad: {member}"
                            )

                    # Entpacken

                    zip_ref.extractall(extract_dir)

                    print(
                        f"  Entpackt nach: {extract_dir}"
                    )

                    # Bilder übernehmen

                    for file in extract_dir.rglob("*"):

                        if file.is_file():

                            save_image_if_valid(file)

            except zipfile.BadZipFile:

                print("  Fehlerhafte ZIP Datei")

                shutil.move(
                    zip_target,
                    REJECT_DIR / zip_target.name
                )

            except Exception as e:

                print(f"  Fehler: {e}")

                shutil.move(
                    zip_target,
                    REJECT_DIR / zip_target.name
                )

# =========================================================
# Cleanup
# =========================================================

mail.logout()

print("\nFertig.")