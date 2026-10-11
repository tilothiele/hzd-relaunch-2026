import logging
import os
from contextlib import asynccontextmanager
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI, HTTPException

from app.runner import JobRunner

logging.basicConfig(
	level=logging.INFO,
	format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

runner = JobRunner()


def _env_flag(name: str, default: bool) -> bool:
	raw = os.getenv(name)
	if raw is None:
		return default
	return raw.strip().lower() in {"1", "true", "yes", "on"}


def _cron_settings() -> dict:
	return {
		"enabled": _env_flag("JOB_CRON_ENABLED", True),
		"expression": os.getenv("JOB_CRON", "0 3 * * *"),
		"timezone": os.getenv("JOB_TIMEZONE", "Europe/Berlin"),
	}


def _start_scheduler() -> BackgroundScheduler | None:
	settings = _cron_settings()
	if not settings["enabled"]:
		logger.info("Cron ist deaktiviert.")
		return None

	timezone = ZoneInfo(settings["timezone"])
	scheduler = BackgroundScheduler(timezone=timezone)
	scheduler.add_job(
		runner.start_scheduled,
		CronTrigger.from_crontab(settings["expression"], timezone=timezone),
		id="chromosoft-transfer",
		replace_existing=True,
	)
	scheduler.start()
	logger.info(
		"Cron aktiv: %s (%s)",
		settings["expression"],
		settings["timezone"],
	)
	return scheduler


@asynccontextmanager
async def _lifespan(_app: FastAPI):
	scheduler = _start_scheduler()
	try:
		yield
	finally:
		if scheduler is not None:
			scheduler.shutdown(wait=False)


app = FastAPI(title="chromosoft-transfer", lifespan=_lifespan)


@app.get("/health")
def health() -> dict:
	return {"status": "ok"}


@app.get("/jobs")
def job_status() -> dict:
	return {
		**runner.status(),
		"cron": _cron_settings(),
	}


@app.post("/jobs", status_code=202)
def start_job() -> dict:
	if not runner.start():
		raise HTTPException(status_code=409, detail="Ein Job läuft bereits.")
	return {"status": "started"}
