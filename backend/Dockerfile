# A Dockerfile is a recipe: a list of steps to build a "container" —
# a small, isolated, reproducible environment that runs the same way
# on your machine, your teammate's machine, and in production.

FROM python:3.12-slim

WORKDIR /app

# Copy just the requirements file first (not the whole codebase yet).
# Docker caches each step — if requirements.txt hasn't changed,
# Docker skips reinstalling packages on every rebuild, which makes
# day-to-day development much faster.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the actual application code.
COPY app ./app

EXPOSE 8000

# No --reload here: that's a dev-only convenience (docker-compose.yml
# passes it in separately for local work). $PORT is set by hosts like
# Railway/Render at runtime; 8000 is the fallback for `docker run` locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
