
from typing import Any, Dict

from fastapi import logger
from app.services.ai_service.openai_service import client as openai_client # Uisti sa, že tento import funguje


MAX_TEXT_FOR_SUMMARY = 8000 # Koľko znakov z extrahovaného textu pošleme na sumarizáciu
def summarize_text_with_openai(text_content: str, max_length: int = 150) -> Dict[str, Any]:
    """
    Vygeneruje kľúčové body + sumarizáciu pre daný text pomocou OpenAI.
    max_length je cieľová dĺžka sumarizácie v slovách.
    """
    if not openai_client:
        return {"summary": None, "error": "OpenAI client not initialized."}
    if not text_content or not text_content.strip():
        return {"summary": None, "error": "No content provided for summarization."}

    prompt = f"""
    Nasleduje text zo študijného materiálu. Tvojou úlohou je:
    1. Vytvoriť 2 až 3 kľúčové myšlienky ako bullet pointy (krátke a vecné).
    2. Potom vytvoriť stručnú sumarizáciu textu v slovenčine.
    
    Dĺžka sumarizácie: približne {max_length} slov.

    Text na spracovanie:
    ---
    {text_content[:MAX_TEXT_FOR_SUMMARY]}
    ---
    
    Výstup:
    • Kľúčová myšlienka 1  
    • Kľúčová myšlienka 2  
    • (voliteľná) Kľúčová myšlienka 3  
    
    Sumarizácia:
    """
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Si AI asistent špecializovaný na sumarizáciu a extrakciu kľúčových bodov z textov."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=400  # zvýšené pre kľúčové body + sumár
        )
        summary = completion.choices[0].message.content
        return {"summary": summary.strip() if summary else None, "error": None}
    except Exception as e:
        logger.error("Error calling OpenAI API for summarization: %s", e, exc_info=True)
        return {"summary": None, "error": str(e)}
