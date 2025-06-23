
from typing import Any, Dict

from fastapi import logger
from app.services.ai_service.openai_service import client as openai_client # Uisti sa, že tento import funguje


MAX_TEXT_FOR_SUMMARY = 8000 # Koľko znakov z extrahovaného textu pošleme na sumarizáciu

def summarize_text_with_openai(text_content: str, max_length: int = 150) -> Dict[str, Any]:
    """
    Vygeneruje krátku sumarizáciu pre daný text pomocou OpenAI.
    max_length je približná cieľová dĺžka sumarizácie v slovách (ale OpenAI to nemusí presne dodržať).
    """
    if not openai_client:
        return {"summary": None, "error": "OpenAI client not initialized."}
    if not text_content or not text_content.strip():
        return {"summary": None, "error": "No content provided for summarization."}

    prompt = f"""
    Nasleduje text zo študijného materiálu. Tvojou úlohou je vytvoriť stručnú a výstižnú sumarizáciu tohto textu v slovenčine.
    Sumarizácia by mala obsahovať kľúčové informácie a hlavné myšlienky textu.
    Cieľová dĺžka sumarizácie je približne {max_length} slov.

    Text na sumarizáciu:
    ---
    {text_content[:MAX_TEXT_FOR_SUMMARY]} 
    ---
    Sumarizácia:
    """
    # print(f"\n--- OpenAI Prompt for Summarization ---\n{prompt[:500]}...\n---------------------\n") # Pre ladenie

    try:
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo", # Alebo iný model vhodný na sumarizáciu
            messages=[
                {"role": "system", "content": "Si AI asistent špecializovaný na sumarizáciu textov a identifikáciu kľúčových informácií."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300  # Odhad pre sumarizáciu okolo 150 slov
        )
        summary = completion.choices[0].message.content
        # print(f"--- OpenAI Raw Summary ---\n{summary}\n-------------------------\n") # Pre ladenie
        return {"summary": summary.strip() if summary else None, "error": None}
    except Exception as e:
        logger.error("Error calling OpenAI API for summarization: %s", e, exc_info=True)
        return {"summary": None, "error": str(e)}