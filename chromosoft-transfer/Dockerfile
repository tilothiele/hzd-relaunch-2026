FROM python:3.12-slim

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
	&& python -m playwright install --with-deps chromium \
	&& chmod -R a+rX /ms-playwright

COPY app ./app
COPY scripts ./scripts

RUN useradd --create-home --uid 1000 appuser
USER appuser
ENV HOME=/home/appuser

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
