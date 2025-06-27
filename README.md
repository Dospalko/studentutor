# 🎓 Studentutor

**Studentutor** je moderná webová aplikácia určená na **správu študijného procesu** — vytváranie predmetov, tém, plánovanie štúdia a sledovanie pokroku študenta. Projekt je postavený ako fullstacková aplikácia s rozdeleným frontendom a backendom, kontajnerizovaný pomocou Docker Compose.

---

## 🚀 Funkcionality

- 🧑‍🏫 Správa používateľov a autentifikácia (JWT)
- 📚 Vytváranie a správa **predmetov** a **tém**
- 📅 Kalendár a plánovanie štúdia
- 🏆 Základný systém **odmien / achievements**
- ⚡ Moderné UI s hot-reload vývojom pre rýchly vývoj
- 🐳 Docker Compose setup pre dev aj produkčné nasadenie

---

## 🧱 Použité technológie

### 🔙 Backend (Python):
- [FastAPI](https://fastapi.tiangolo.com/)
- SQLAlchemy (ORM)
- SQLite / PostgreSQL (v produkcii)
- Pydantic
- Uvicorn
- `python-jose` (JWT)
- Docker

### 🔜 Frontend (JavaScript/TypeScript):
- [Next.js](https://nextjs.org/)
- React
- Shadcn/ui (komponentová knižnica)
- Tailwind CSS
- Zustand (state management)
- Axios

### 🐳 DevOps:
- Docker + Docker Compose
- Volumes pre hot-reload
- Makefile pre jednoduchý vývoj/produkciu

---

## 🧑‍💻 Lokálny vývoj

> 🔁 Všetko beží v Docker kontejnery s automatickým reloadom pre frontend aj backend.

### ✅ Spustenie vývojového režimu:

```bash
make dev


commit for a day false frda