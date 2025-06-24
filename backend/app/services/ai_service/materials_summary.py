# ==============================================
# app/services/ai_service/materials_summary.py
# ==============================================
from __future__ import annotations

from typing import Any, Dict, List
import json
import logging

from app.services.ai_service.openai_service import client as openai_client  # musí existovať

logger = logging.getLogger(__name__)

MAX_TEXT_FOR_SUMMARY = 8_000        # max. znakov poslaných do LLM
MAX_TEXT_FOR_TAGS    = 5_000        # max. znakov poslaných do LLM pre tagy


# --------------------------------------------------------------------------- #
# SUMMARIZATION                                                               #
# --------------------------------------------------------------------------- #
def summarize_text_with_openai(text_content: str, max_length: int = 150) -> Dict[str, Any]:
    """
    Vráti slovník:
        { "summary": str | None, "error": str | None }
    Formát výstupu je – bullet-pointy + „Sumarizácia:“ blok.
    """
    if openai_client is None:
        return {"summary": None, "error": "OpenAI client not initialised."}

    text_content = (text_content or "").strip()
    if not text_content:
        return {"summary": None, "error": "Empty text – nothing to summarise."}

    prompt = f"""
Nasleduje text zo študijného materiálu. Tvojou úlohou je:
1. Vytvoriť 2–3 kľúčové myšlienky ako bullet-pointy (stručné, vecné).
2. Potom napísať súvislú sumarizáciu v slovenčine (cca {max_length} slov).

Formát výstupu:
• Kľúčová myšlienka 1
• Kľúčová myšlienka 2
• (voliteľne) Kľúčová myšlienka 3

Sumarizácia:
<text>

Text na spracovanie:
---
{text_content[:MAX_TEXT_FOR_SUMMARY]}
---
"""

    try:
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Si AI asistent špecializovaný na edukatívne sumarizácie "
                        "a extrakciu kľúčových bodov."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=400,
        )
        raw = (completion.choices[0].message.content or "").strip()
        return {"summary": raw if raw else None, "error": None}

    except Exception as exc:  # pragma: no cover – zachytí aj sieťové chyby
        logger.error("OpenAI summarization failed: %s", exc, exc_info=True)
        return {"summary": None, "error": str(exc)}


# --------------------------------------------------------------------------- #
# TAG EXTRACTION                                                              #
# --------------------------------------------------------------------------- #
def extract_tags_from_text(text_content: str) -> List[str]:
    """
    Vráti zoznam tagov BEZ # (napr. ["biológia", "dejiny"]).
    Ak zlyhá – vráti prázdny list.
    """
    if openai_client is None:
        logger.warning("OpenAI client not initialised – cannot extract tags.")
        return []

    text_content = (text_content or "").strip()
    if not text_content:
        return []

    prompt = f"""
Z nasledujúceho textu vyber 3–5 najrelevantnejších tagov v slovenčine.
Výstup VÝHRADNE ako čiarkou oddelený zoznam hashtagov (bez dodatkových viet), napr.:
#biológia, #dejiny, #výpočty

Text:
---
{text_content[:MAX_TEXT_FOR_TAGS]}
---
"""

    try:
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Si AI na kategorizovanie študijných materiálov."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=100,
        )
        raw = (completion.choices[0].message.content or "").strip()

        # Split podľa , alebo \n a odstráň #
        tags = [t.strip().lstrip("#") for t in raw.replace("\n", ",").split(",") if t.strip()]
        # odstráň duplicitné & prázdne
        unique_tags = list(dict.fromkeys([t for t in tags if t]))

        return unique_tags
    except Exception as exc:  # pragma: no cover
        logger.error("Tag extraction failed: %s", exc, exc_info=True)
        return []
