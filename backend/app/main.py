# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import users, auth, subjects, topics # Pridaj subjects a topics

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personalizovaný Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(subjects.router) # Prefix a tagy sú už definované v routeri
app.include_router(topics.router)   # Prefix a tagy sú už definované v routeri


@app.get("/")
async def root():
    return {"message": "Vitaj v API Personalizovaného Tutora!"}