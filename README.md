bash

# Studentutor

Studentutor je webová aplikácia na správu študijného procesu, určená pre študentov a učiteľov. Umožňuje vytvárať predmety, témy, plánovať štúdium, sledovať pokrok a spravovať študijné materiály. Projekt je rozdelený na frontend (Next.js/React) a backend (FastAPI/Python), oba sú kontajnerizované pomocou Docker Compose.

## Hlavné vlastnosti

- Správa používateľov a autentifikácia pomocou JWT
- Vytváranie, editácia a mazanie predmetov a tém
- Plánovanie štúdia s kalendárom a študijnými blokmi
- Sledovanie pokroku a štatistík
- Systém odmien (achievements)
- Pridávanie a správa študijných materiálov (napr. PDF, poznámky)
- Moderné používateľské rozhranie s podporou hot-reloadu
- Kompletný Docker Compose setup pre vývoj aj produkciu

## Technologický stack

### Backend (Python)
- FastAPI (REST API framework)
- SQLAlchemy (ORM)
- SQLite (vývoj) / PostgreSQL (produkcia)
- Pydantic (validácia dát)
- Uvicorn (ASGI server)
- python-jose (JWT autentifikácia)
- Docker

### Frontend (TypeScript/JavaScript)
- Next.js (React framework)
- React
- Shadcn/ui (UI komponenty)
- Tailwind CSS (štýlovanie)
- Zustand (globálny stav)
- Axios (HTTP klient)

### DevOps
- Docker a Docker Compose
- Hot-reload pre frontend aj backend
- Makefile pre jednoduché spúšťanie a buildovanie

## Lokálny vývoj

Celý projekt je možné spustiť v Docker kontejnery s automatickým reloadom pre frontend aj backend.

### Spustenie vývojového prostredia

1. Skopírujte si repozitár a pripravte si `.env` súbory podľa vzoru `.env.example`.
2. Spustite vývojové kontajnery:

```bash
make dev
```

Frontend bude dostupný na http://localhost:3000
Backend (API + dokumentácia) na http://localhost:8000
PostgreSQL beží v kontejnery na porte 5432

### Zastavenie vývoja

```bash
make down
```

### Produkčné nasadenie

1. Pripravte si `.env.prod` s produkčnými premennými (napr. `DATABASE_URL`, `JWT_SECRET_KEY`, `NEXT_PUBLIC_API_URL` atď.)
2. Spustite produkčné kontajnery:

```bash
make prod
```

Produkčné kontajnery bežia bez hot-reloadu a s persistenciou dát v Docker volume.

## Štruktúra repozitára

```
.
├─ backend/        # FastAPI aplikácia
│  ├─ app/         # moduly, routery, služby
│  └─ Dockerfile
├─ frontend/       # Next.js aplikácia
│  ├─ src/
│  └─ Dockerfile
├─ docker-compose.yml
├─ Makefile
└─ README.md
```
