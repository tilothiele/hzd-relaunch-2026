import logging
import threading
from datetime import datetime, timezone

from app.job import run as run_job

logger = logging.getLogger(__name__)


class JobRunner:
	def __init__(self) -> None:
		self._lock = threading.Lock()
		self._running = False
		self._last_run: dict | None = None

	def status(self) -> dict:
		with self._lock:
			return {
				"running": self._running,
				"lastRun": self._last_run,
			}

	def start(self) -> bool:
		with self._lock:
			if self._running:
				return False
			self._running = True

		thread = threading.Thread(
			target=self._execute,
			name="chromosoft-transfer-job",
			daemon=True,
		)
		thread.start()
		return True

	def start_scheduled(self) -> None:
		if not self.start():
			logger.info("Geplanter Lauf übersprungen, ein Job läuft bereits.")

	def _execute(self) -> None:
		started_at = _now()
		status = "succeeded"
		error = None
		logger.info("Job gestartet")
		try:
			run_job()
		except Exception as exc:
			status = "failed"
			error = str(exc)
			logger.exception("Job fehlgeschlagen")
		finally:
			finished_at = _now()
			with self._lock:
				self._running = False
				self._last_run = {
					"startedAt": started_at,
					"finishedAt": finished_at,
					"status": status,
					"error": error,
				}
			logger.info("Job beendet: %s", status)


def _now() -> str:
	return datetime.now(timezone.utc).isoformat()
