FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py x402_middleware.py ./

ENV X402_MODE=simulated \
    PORT=4020 \
    PYTHONUNBUFFERED=1

EXPOSE 4020

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-4020}"]
