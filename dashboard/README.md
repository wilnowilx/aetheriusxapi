# AetheriusX Dashboard

Static control-room frontend served by FastAPI at `/dashboard`.

The dashboard intentionally uses demo telemetry until the VM backend publishes the corresponding observability routes. It checks `/health` and is ready to replace the catalog, activity, and drift values with real API responses.
