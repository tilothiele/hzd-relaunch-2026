import logging
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import requests

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = ROOT / "scripts"
FETCH_TIMEOUT_SECONDS = 3600
UPLOAD_TIMEOUT_SECONDS = 1800

FETCHES = (
	(
		"fetch-all-dogs-from-chromosoft.py",
		"alle_hzd_hunde.csv",
		"/api/upload-cs-dogs",
		"dogs.csv",
	),
	(
		"fetch-all-members-from-chromosoft.py",
		"alle_hzd_mitglieder.csv",
		"/api/upload-cs-member",
		"members.csv",
	),
)


def run() -> None:
	_require_env("CHROMOSOFT_USERNAME")
	_require_env("CHROMOSOFT_PASSWORD")
	_require_env("API_TOKEN")
	api_url = _api_url()

	workdir = Path(tempfile.mkdtemp(prefix="chromosoft-transfer-"))
	try:
		produced: list[tuple[Path, str, str]] = []
		for script_name, filename, upload_path, field in FETCHES:
			_run_script(script_name, workdir)
			csv_path = workdir / filename
			if not csv_path.is_file() or csv_path.stat().st_size == 0:
				raise RuntimeError(f"{filename} wurde nicht erzeugt.")
			produced.append((csv_path, upload_path, field))

		for csv_path, upload_path, field in produced:
			_upload(api_url, upload_path, field, csv_path)
	finally:
		shutil.rmtree(workdir, ignore_errors=True)


def _run_script(script_name: str, workdir: Path) -> None:
	script = SCRIPT_DIR / script_name
	if not script.is_file():
		raise RuntimeError(f"Skript fehlt: {script}")

	logger.info("Starte %s", script_name)
	try:
		completed = subprocess.run(
			[sys.executable, str(script)],
			cwd=workdir,
			env=os.environ.copy(),
			check=False,
			capture_output=True,
			text=True,
			timeout=FETCH_TIMEOUT_SECONDS,
		)
	except subprocess.TimeoutExpired as exc:
		raise RuntimeError(
			f"{script_name} hat das Zeitlimit von {FETCH_TIMEOUT_SECONDS}s überschritten."
		) from exc

	if completed.stdout:
		logger.info("%s stdout: %s", script_name, completed.stdout.strip())
	if completed.returncode != 0:
		if completed.stderr:
			logger.error("%s stderr: %s", script_name, completed.stderr.strip())
		raise RuntimeError(
			f"{script_name} ist mit Status {completed.returncode} fehlgeschlagen."
		)
	if completed.stderr:
		logger.info("%s stderr: %s", script_name, completed.stderr.strip())


def _upload(api_url: str, path: str, field: str, csv_path: Path) -> None:
	url = f"{api_url}{path}"
	logger.info("Lade %s nach %s als %s", csv_path.name, url, field)
	with csv_path.open("rb") as handle:
		response = requests.post(
			url,
			headers={"Authorization": f"Bearer {_require_env('API_TOKEN')}"},
			files={field: (field, handle, "text/csv")},
			timeout=UPLOAD_TIMEOUT_SECONDS,
		)
	if not response.ok:
		raise RuntimeError(
			f"Upload {field} fehlgeschlagen ({response.status_code}): {response.text}"
		)
	logger.info("Upload %s erfolgreich: %s", field, response.text.strip())


def _api_url() -> str:
	return os.getenv("API_URL", "http://localhost:1337").strip().rstrip("/")


def _require_env(name: str) -> str:
	value = os.getenv(name, "").strip()
	if not value:
		raise RuntimeError(f"{name} ist nicht gesetzt.")
	return value
