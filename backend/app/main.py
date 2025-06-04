from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db # Importuj init_db
# Importuj všetky routery
from app.routers import auth, users, subjects, topics, study_plans 
from app.routers import study_materials # Importuj nový router pre materiály

init_db() # Vytvorí tabuľky pri štarte

app = FastAPI(title="Personalizovaný Tutor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if hasattr(settings, 'CORS_ORIGINS') else ["http://localhost:3000"], # Lepšie je mať toto v configu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Vitaj v API Personalizovaného Tutora!"}

# Registrácia routerov
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
app.include_router(topics.router) # Prefixy sú už definované v topics.py
app.include_router(study_plans.router, prefix="/study-plans", tags=["Study Plans"])

# Registrácia dvoch routerov pre materiály
app.include_router(study_materials.router) # Pre /subjects/{subject_id}/materials
app.include_router(study_materials.material_router) # Pre /materials/{material_id}/...