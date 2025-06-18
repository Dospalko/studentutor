# Napríklad v backend/app/services/openai_service.py (nový súbor)
from openai import OpenAI
from app.config import settings

client: Optional[OpenAI] = None
if settings.OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        print("OpenAI client initialized successfully.")
    except Exception as e:
        print(f"Error initializing OpenAI client: {e}")
        client = None # Zabezpeč, že client je None, ak inicializácia zlyhá
else:
    print("OPENAI_API_KEY not found. OpenAI features will be disabled.")