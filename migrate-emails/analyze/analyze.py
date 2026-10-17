#!/usr/bin/env python3
"""
Sicherer IMAP-Testlauf:
- durchsucht alle vom Server gemeldeten auswählbaren Ordner
- findet Nachrichten mit IMAP-internem Datum VOR dem Stichtag
- löscht oder verändert keine Nachrichten
- schreibt Treffer in eine CSV-Datei

Konfiguration über Umgebungsvariablen:
  IMAP_HOST   (erforderlich)
  IMAP_USER   (erforderlich)
  IMAP_PORT   (optional, Standard: 993)
  IMAP_PASSWORD (optional; sonst sichere Abfrage am Terminal)

Beispiel:
  export IMAP_HOST="mail.example.com"
  export IMAP_USER="name@example.com"
  python3 imap_audit.py
"""

import csv
import getpass
import imaplib
import os
import re
import ssl
import sys
from datetime import datetime
from email import policy
from email.parser import BytesParser
from pathlib import Path

# IMAP BEFORE ist exklusiv: BEFORE 17-Oct-2024 bedeutet strikt vor diesem Datum.
IMAP_CUTOFF = "17-Oct-2024"
REPORT_FILE = Path("imap_treffer_vor_2024-10-17.csv")


def parse_list_mailbox(line: bytes):
    """Liest Flags und den Mailbox-Namen aus einer üblichen IMAP LIST-Antwort."""
    text = line.decode("ascii", errors="replace").strip()
    match = re.match(r'^\((.*?)\)\s+(?:"(?:\\.|[^"])*"|NIL)\s+', text)
    if not match:
        return None

    flags = set(match.group(1).lower().split())
    remainder = text[match.end():].strip()

    # Der Mailbox-Name ist üblicherweise ein quoted string oder ein Atom.
    if remainder.startswith('"'):
        chars = []
        escaped = False
        end = None
        for i, ch in enumerate(remainder[1:], start=1):
            if escaped:
                chars.append(ch)
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                end = i
                break
            else:
                chars.append(ch)
        if end is None:
            return None
        mailbox = "".join(chars)
    else:
        mailbox = remainder.split()[0] if remainder else ""

    if not mailbox or r"\noselect" in flags:
        return None
    return mailbox


def decode_header_value(raw_value: str) -> str:
    if not raw_value:
        return ""
    # Die E-Mail-Parser-Bibliothek dekodiert MIME-kodierte Header zuverlässig.
    from email.header import decode_header, make_header
    try:
        return str(make_header(decode_header(raw_value)))
    except Exception:
        return raw_value


def main():
    host = os.environ.get("IMAP_HOST", "").strip()
    username = os.environ.get("IMAP_USER", "").strip()
    port_text = os.environ.get("IMAP_PORT", "993").strip()
    password = os.environ.get("IMAP_PASSWORD")

    if not host or not username:
        print("Fehler: Bitte IMAP_HOST und IMAP_USER als Umgebungsvariablen setzen.", file=sys.stderr)
        sys.exit(2)
    try:
        port = int(port_text)
    except ValueError:
        print("Fehler: IMAP_PORT muss eine Zahl sein.", file=sys.stderr)
        sys.exit(2)

    if password is None:
        password = getpass.getpass(f"IMAP-Passwort für {username}: ")

    tls_context = ssl.create_default_context()
    connection = None
    total = 0
    folder_count = 0
    errors = []

    print(f"Verbinde sicher mit {host}:{port} …")
    print(f"Testlauf: Nachrichten mit internem IMAP-Datum vor {IMAP_CUTOFF}.")
    print("Modus: NUR LESEN – es werden keine Nachrichten gelöscht oder verändert.\n")

    try:
        connection = imaplib.IMAP4_SSL(host, port, ssl_context=tls_context)
        connection.login(username, password)

        status, listed = connection.list()
        if status != "OK" or not listed:
            raise RuntimeError("Der Server konnte keine Ordnerliste liefern.")

        folders = []
        for line in listed:
            if not line:
                continue
            mailbox = parse_list_mailbox(line)
            if mailbox is not None and mailbox not in folders:
                folders.append(mailbox)

        if not folders:
            raise RuntimeError("Keine auswählbaren Ordner gefunden.")

        with REPORT_FILE.open("w", newline="", encoding="utf-8-sig") as csv_file:
            writer = csv.DictWriter(
                csv_file,
                fieldnames=["ordner", "uid", "internes_datum", "absender", "betreff"],
            )
            writer.writeheader()

            for mailbox in folders:
                try:
                    status, _ = connection.select(mailbox, readonly=True)
                    if status != "OK":
                        errors.append(f"{mailbox}: Ordner konnte nicht geöffnet werden")
                        continue
                    folder_count += 1

                    status, data = connection.uid("SEARCH", None, "BEFORE", IMAP_CUTOFF)
                    if status != "OK":
                        errors.append(f"{mailbox}: Suche fehlgeschlagen")
                        continue

                    uids = data[0].split() if data and data[0] else []
                    if not uids:
                        print(f"[0 Treffer] {mailbox}")
                        continue

                    print(f"[{len(uids)} Treffer] {mailbox}")
                    for uid in uids:
                        status, fetched = connection.uid(
                            "FETCH", uid, "(INTERNALDATE BODY.PEEK[HEADER.FIELDS (DATE FROM SUBJECT)])"
                        )
                        if status != "OK" or not fetched:
                            errors.append(f"{mailbox}, UID {uid.decode(errors='replace')}: Header nicht lesbar")
                            continue

                        raw_header = b""
                        internal_date = ""
                        for item in fetched:
                            if not isinstance(item, tuple) or len(item) < 2:
                                continue
                            meta = item[0].decode("ascii", errors="replace")
                            date_match = re.search(r'INTERNALDATE "([^"]+)"', meta)
                            if date_match:
                                internal_date = date_match.group(1)
                            raw_header = item[1] or b""

                        message = BytesParser(policy=policy.default).parsebytes(raw_header)
                        uid_text = uid.decode("ascii", errors="replace")
                        subject = decode_header_value(str(message.get("Subject", "")))
                        sender = decode_header_value(str(message.get("From", "")))

                        writer.writerow({
                            "ordner": mailbox,
                            "uid": uid_text,
                            "internes_datum": internal_date,
                            "absender": sender,
                            "betreff": subject,
                        })
                        total += 1

        print("\nTestlauf abgeschlossen.")
        print(f"Durchsuchte Ordner: {folder_count}")
        print(f"Gefundene Nachrichten: {total}")
        print(f"CSV-Bericht: {REPORT_FILE.resolve()}")
        if errors:
            print(f"\nHinweis: {len(errors)} Problem(e) aufgetreten:")
            for error in errors:
                print(f"  - {error}")
            print("Prüfe diese Ordner separat; der Bericht kann unvollständig sein.")
        print("\nEs wurde nichts gelöscht oder verändert.")

    except (imaplib.IMAP4.error, OSError, RuntimeError) as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        if connection is not None:
            try:
                connection.logout()
            except Exception:
                pass


if __name__ == "__main__":
    main()
