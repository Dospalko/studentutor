# backend/Dockerfile

# Použi oficiálny Python image
FROM python:3.10-slim-buster

# Nastav pracovný adresár v kontajneri
WORKDIR /app

# Optimalizácia pre Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Skopíruj súbor s požiadavkami
COPY requirements.txt .

# Nainštaluj Python závislosti
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Vytvor adresár pre dáta (napr. SQLite DB)
# SQLAlchemy by ho mal vytvoriť, ak neexistuje, ale pre istotu:
RUN mkdir -p /app/data

# Skopíruj zvyšok aplikácie
COPY ./app ./app
# .env sa načíta cez docker-compose, nekopíruj ho priamo do image pre produkciu
# Pre tento vývojový setup ho môžeme skopírovať, ak by sme nepoužívali env_file v compose
# COPY .env .

# Príkaz na spustenie aplikácie
# Uvicorn pobeží na porte 8000 vo vnútri kontajnera
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]