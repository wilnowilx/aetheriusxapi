"""
Optimized uvicorn startup for AETHERIUS daemon.

Replaces the bare `uvicorn.run(app)` in main.py with production-grade settings:
- 2 workers (i7 can handle more, but we're I/O bound on upstreams)
- Keep-alive connections
- Graceful shutdown
- Performance tuning for agent workloads

Usage:
  python uvicorn_optimized.py

Or replace in main.py:
  # OLD: uvicorn.run(app, host="0.0.0.0", port=port)
  # NEW:
  from uvicorn_optimized import run_optimized
  run_optimized(app, port=port)
"""

import uvicorn
import os
import multiprocessing


def run_optimized(app, port: int = 4020):
    """Production-grade uvicorn startup."""

    workers = int(os.environ.get("UVICORN_WORKERS", 2))
    log_level = os.environ.get("LOG_LEVEL", "info")

    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=port,
        workers=workers,

        # --- HTTP tuning ---
        http="httptools",           # Faster than h11
        loop="uvloop",              # Faster event loop
        lifespan="on",

        # --- Keep-alive ---
        timeout_keep_alive=30,      # Hold connections 30s
        timeout_notify=30,

        # --- Limits ---
        limit_concurrency=1000,     # Max concurrent connections
        limit_max_requests=10000,   # Restart worker after 10K requests (prevent leaks)

        # --- Backlog ---
        backlog=2048,

        # --- Logging ---
        log_level=log_level,
        access_log=True,

        # --- Headers ---
        date_header=True,
        server_header=True,
        server_header_format="aetheriusxAPI",
    )

    print(f"[UVICORN] Starting with {workers} workers, port {port}")
    print(f"[UVICORN] HTTP: httptools, Loop: uvloop")
    print(f"[UVICORN] Keep-alive: 30s, Limit: 1000 concurrent")
    print(f"[UVICORN] Worker restart: every 10,000 requests")

    uvicorn.run(config)


if __name__ == "__main__":
    # Standalone test
    from fastapi import FastAPI
    app = FastAPI()

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    run_optimized(app)
