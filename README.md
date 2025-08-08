## Studentutor

Studentutor je webová aplikácia na správu študijného procesu (predmety, témy, plánovanie, štatistiky, materiály, odmeny). Full‑stack architektúra: Frontend (Next.js/React), Backend (FastAPI/Python). Obe časti sú kontajnerizované cez Docker Compose.

### Hlavné vlastnosti
| Oblasť | Funkcie |
|--------|---------|
| Používatelia | Registrácia, Login, JWT autentifikácia |
| Predmety & Témy | CRUD, statusy, prehľad progresu |
| Študijný plán | AI generované bloky, kalendár, presúvanie |
| Materiály | Upload, prepojenie so študijnými blokmi |
| Achievements | Základný systém odmien |
| Email | Reset hesla (SMTP) |
| UI | Moderný dizajn, animácie, hot‑reload |

### Tech Stack (skrátene)
Backend: FastAPI, SQLAlchemy, Pydantic, JWT, (SQLite/Postgres)  
Frontend: Next.js 15 (App Router), React, Tailwind, shadcn/ui  
Infra: Docker, Docker Compose, (voliteľne Alembic – zatiaľ create_all)

---
## Kompletný Setup

### 0. Prerekvizity
Docker Desktop (zapnutý), Git. (Node & Python iba ak chceš mimo Docker.)

### 1. Klonovanie
```powershell
git clone <repo-url> studentutor
cd studentutor
```

### 2. Env súbory
```powershell
Copy-Item backend/.env.example backend/.env
```
Uprav minimálne `SECRET_KEY` a `FRONTEND_URL`. Pre Postgres zmeň `DATABASE_URL`.

### 3. Spustenie (vývoj – Docker)
```powershell
docker-compose up --build
```
Frontend: http://localhost:3000  
API & Docs: http://localhost:8000/docs

Makefile alias: `make dev`

### 4. Prepínač DB (SQLite ↔ Postgres)
SQLite (default): `sqlite:///./data/tutor_app.db`  
Postgres: `postgresql+psycopg2://tutoruser:tutorpassword@postgres:5432/tutordb`  
Reštart backend po zmene: `docker-compose restart backend`

### 5. Produkčný build (jednoduchý)
```powershell
docker-compose down -v
docker-compose up --build -d
```
Optimalizuj: silný SECRET_KEY, CORS whitelist, reverzný proxy.

### 6. Lokálne bez Docker (voliteľné)
Backend:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Frontend:
```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 7. Rýchly test
1. http://localhost:8000/docs  
2. Register + Login (získaš token)  
3. Volaj chránené endpointy s Authorization Bearer  
4. Frontend login  
5. Vytvor predmet, témy, generuj plán

### 8. Údržba / Skratky
| Akcia | Príkaz |
|-------|-------|
| Dev štart | `make dev` |
| Rebuild všetko | `make build` |
| Restart backend | `make restart-backend` |
| Restart frontend | `make restart-frontend` |
| Stop | `make stop` |
| Down + volumes | `make down` |
| Clear Next.js cache | `make reset-frontend-cache` |

### 9. Email / OpenAI
Premenné nechaj prázdne ak netreba. Pre Gmail: App Password (nie bežné heslo). Ak logika padá na chýbajúcich hodnotách, dočasne vlož placeholder.

### 10. ESLint / Typy
ESLint je ignorovaný počas buildov (pozri `next.config.ts`). Lokálne môžeš zapnúť lint ručne po doplnení scriptu.

### 11. Troubleshooting
| Problém | Príznak | Riešenie |
|---------|--------|----------|
| Docker daemon off | pipe error / exit code 1 | Spusť Docker Desktop |
| Build FE zlyhá na TS | Failed to compile | Doplň chýbajúce props / typy (alebo ponechaj ignore) |
| Backend nevidí DB | Connection refused | Skontroluj host `postgres` v URL |
| CORS blokuje | Browser error | Pridaj origin v `main.py` |
| 500 pri emailoch | SMTP error | Vyplň MAIL_* alebo mock |
| Chýba psycopg2 | ImportError | Rebuild backend image |

### 12. Bezpečnosť
- Nepushuj skutočné tajomstvá (.env je v .gitignore – over).  
- Rotuj uniknuté kľúče (OpenAI, SMTP).  
- V produkcii vypni auto `create_all()` a použi migrácie.  
- Limituj CORS a pridaj HTTPS (proxy, cert).  

### 13. Budúce zlepšenia
- Alembic migrácie  
- CI pipeline (lint, test, build)  
- Health checks + monitoring  
- Rate limiting  
- Centralizovaný logging  

### 14. Cheat‑Sheet
```powershell
# Dev
docker-compose up --build

# Rebuild FE
docker-compose build frontend

# Rebuild BE
docker-compose build backend; docker-compose restart backend

# Switch DB → edit .env, potom
docker-compose restart backend postgres

# Clean
docker-compose down -v
```

---
Ak chceš doplniť migrácie alebo CI, napíš.
