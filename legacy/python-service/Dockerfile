# =============================================================================
# Python FastAPI Service - Multi-stage Dockerfile
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage - Shared dependencies
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Development Stage - Hot reload enabled
# -----------------------------------------------------------------------------
FROM base AS development
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBUG=true

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start development server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -----------------------------------------------------------------------------
# Production Stage - Optimized runtime
# -----------------------------------------------------------------------------
FROM base AS production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBUG=false

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Start production server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
