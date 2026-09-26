FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive \
    MEDIA_ROOT=/app/media

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --requirement /app/backend/requirements.txt

COPY backend /app/backend

RUN mkdir -p /app/media

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://localhost:' + os.getenv('PORT', '8000') + '/api/health', timeout=3)"

# Job registry process belleğinde olduğu için bu sprintte tek Uvicorn worker kullanılır.
CMD ["sh", "-c", "exec uvicorn backend.main:app --host :: --port ${PORT:-8000} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
