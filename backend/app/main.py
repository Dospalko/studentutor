# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import users, auth # Neskôr pridáme ďalšie routre

# Vytvorenie tabuliek v databáze (ak neexistujú)
# V produkcii by si mal použiť Alembic migrácie
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personalizovaný Tutor API")

# Nastavenie CORS (Cross-Origin Resource Sharing)
# Umožní frontendu komunikovať s backendom z inej domény/portu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Adresa tvojho Next.js frontendu
    allow_credentials=True,
    allow_methods=["*"], # Umožní všetky HTTP metódy
    allow_headers=["*"], # Umožní všetky hlavičky
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
# app.include_router(study_plans.router, prefix="/study-plans", tags=["study_plans"])


@app.get("/")
async def root():
    return {"message": "Vitaj v API Personalizovaného Tutora!"}

# Sem budeme postupne pridávať ďalšie routre pre predmety, plány atď.