FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py x402_middleware.py ./
COPY dashboard ./dashboard

EXPOSE 4020
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4020"]
