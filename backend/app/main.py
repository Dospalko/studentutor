# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine  # Importuj engine pre init_db
from app.db.base import init_db  # Importuj init_db z app.db.base

# Importuj všetky moduly routerov
from app.routers import auth
from app.routers import users
from app.routers import subjects
from app.routers import topics
from app.routers import study_plans
from app.routers import study_materials
from app.routers import achievements
# Zavolaj init_db na začiatku, aby sa vytvorili tabuľky (ak neexistujú)
# Toto sa vykoná len raz pri štarte aplikácie.
try:
    init_db(engine)
except Exception as e:
    print(f"CRITICAL ERROR during DB initialization: {e}")
    # Môžeš tu zvážiť ukončenie aplikácie, ak DB je nevyhnutná
    # import sys
    # sys.exit(1)


app = FastAPI(
    title="Personalizovaný Tutor API",
    version="0.1.0",
    description="API pre personalizovaného AI študijného tútora.",
    # openapi_url="/api/v1/openapi.json" # Ak chceš zmeniť cestu k OpenAPI schéme
)

# Nastavenie CORS
# Ideálne je mať zoznam povolených originov v konfigurácii
# (napr. settings.BACKEND_CORS_ORIGINS, čo by bol zoznam stringov)
# Ak settings.BACKEND_CORS_ORIGINS neexistuje, použi default.
# V .env by si potom mal napr. BACKEND_CORS_ORIGINS='["http://localhost:3000","http://localhost:3001","https://tvoja-produkcia.com"]'
# Pydantic by to mal vedieť spracovať ako List[str], ak je správne definovaný v config.py.
# Pre jednoduchosť teraz použijem priamo zoznam.
allowed_origins = [
    "http://localhost:3000", # Tvoj frontend
    "http://localhost:3001", # Ak by si mal iný port pre vývoj
    # Pridaj produkčnú doménu frontendu, keď budeš nasadzovať
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # prípadne ["*"] počas vývoja
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
async def read_root():
    """
    Root endpoint pre API.
    """
    return {"message": "Vitaj v API Personalizovaného Tutora! Dokumentácia je na /docs"}

# Zahrnutie (registrácia) routerov do FastAPI aplikácie
app.include_router(auth.router) # Prefix a tagy sú definované v auth.py
app.include_router(users.router) # Prefix a tagy sú definované v users.py
app.include_router(subjects.router) # Prefix a tagy sú definované v subjects.py
app.include_router(topics.router) # Prefixy a tagy sú definované v topics.py
app.include_router(study_plans.router) # Prefix a tagy sú definované v study_plans.py

# Pre study_materials.py, kde máme dva routery:
app.include_router(study_materials.router)        # Pre cesty začínajúce /subjects/{subject_id}/materials
app.include_router(study_materials.material_router) # Pre cesty začínajúce /materials
app.include_router(achievements.router)