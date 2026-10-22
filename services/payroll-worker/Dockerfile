FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml ./
COPY payroll_worker ./payroll_worker
RUN pip install --no-cache-dir .
RUN useradd --create-home worker && mkdir -p /data/exports && chown worker /data/exports
USER worker
ENV PYTHONUNBUFFERED=1
CMD ["python", "-m", "payroll_worker"]
