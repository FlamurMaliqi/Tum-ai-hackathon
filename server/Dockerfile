FROM python:3.11-slim

# Install curl for healthcheck and uv
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy project files
COPY pyproject.toml ./
COPY main.py ./
COPY api/ ./api/

# Install dependencies
RUN uv sync 

# Run the application
CMD ["uv", "run", "python", "main.py"]

