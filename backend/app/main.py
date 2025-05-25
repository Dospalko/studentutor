# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base # Base pre create_all
# from . import models # nepotrebujeme models priamo, ale Base.metadata potrebuje, aby boli modely importované
from .routers import users, auth, subjects, topics # PRIDAJ topics
from .config import settings

# Presuň create_all sem, aby boli všetky modely určite načítané pred volaním create_all
# Importuj všetky modely, aby boli zaregistrované v Base.metadata
from .models import User, Subject, Topic

Base.metadata.create_all(bind=engine) # Vytvorí tabuľky, ak neexistujú

app = FastAPI(title="Personalizovaný Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"], # Adresa tvojho Next.js frontendu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Vitaj v API Personalizovaného Tutora!"}

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(subjects.router, prefix="/subjects", tags=["subjects"]) # Prefix je už tu
app.include_router(topics.router) # Prefixy sú definované v samotnom topics routeri