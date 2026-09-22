FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

ENV UV_PROJECT_ENVIRONMENT=/app/.venv

RUN pip install uv --no-cache-dir

COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY apps/api/src/ ./src/
RUN uv sync --frozen --no-dev --no-editable


FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

RUN groupadd -r authengine && useradd -r -g authengine authengine

COPY --from=builder /app/.venv /app/.venv

COPY apps/api/src/ ./src/
COPY apps/api/alembic/ ./alembic/
COPY apps/api/alembic.ini .
COPY apps/api/pyproject.toml .
COPY data/ ./data/

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/src"
ENV AUTHENGINE_SEED_DATA_DIR=/app/data
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN chown -R authengine:authengine /app

USER authengine

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')"

EXPOSE 8000
CMD ["auth-engine", "run"]
