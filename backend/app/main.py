# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .db.models.user import User
from .db.models.subject import Subject
from .db.models.topic import Topic
from .db.models.study_plan import StudyPlan, StudyBlock

# from .config import settings # Odkomentuj, ak settings potrebuješ priamo v main.py
from .routers import auth, users, subjects, topics, study_plans

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personalizovaný Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Vitaj v API Personalizovaného Tutora!"}

# Registrácia routerov
app.include_router(auth.router, prefix="/auth", tags=["auth"]) # auth.router pravdepodobne nemá vlastný prefix
app.include_router(users.router) # ODSTRÁNENÝ prefix="/users", tags=["users"] je už v users.router
app.include_router(subjects.router) # ODSTRÁNENÝ prefix="/subjects", tags=["subjects"] je už v subjects.router
app.include_router(topics.router) # Tento už bol správne (bez prefixu tu)
app.include_router(study_plans.router) # ODSTRÁNENÝ prefix="/study-plans", tags=["study_plans"] je už v study_plans.router