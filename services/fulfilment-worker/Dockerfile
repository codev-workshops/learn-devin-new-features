# services/fulfilment-worker — Python 3.12 worker. Build context: this directory.
FROM mirror.gcr.io/library/python:3.12-slim
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
COPY db ./db
RUN pip install --no-cache-dir ".[postgres]"
ENV PYTHONUNBUFFERED=1
EXPOSE 3003
CMD ["kade-worker", "run"]
