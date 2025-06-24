from __future__ import annotations

import json, logging, re
from typing import Any, Dict, List

from app.services.ai_service.openai_service import client as openai_client

logger = logging.getLogger(__name__)

MAX_TEXT_FOR_SUMMARY = 8_000


# ───────────────────────────────
#        SUMMARY + BULLETS
# ───────────────────────────────
def summarize_text_with_openai(text_content: str, max_length: int = 150) -> Dict[str, Any]:
    if not openai_client:
        return {"summary": None, "error": "OpenAI client not initialized."}

    if not text_content.strip():
        return {"summary": None, "error": "No content provided."}

    prompt = f"""
Nasleduje text zo študijného materiálu. Najprv vypíš 2 až 3 kľúčové myšlienky
ako odrážky, potom stručnú sumarizáciu (~{max_length} slov). Vráť presne v
tomto formáte:

• myšlienka 1
• myšlienka 2
• myšlienka 3 (ak treba)

Sumarizácia:
<odstavce>

--- TEXT ---
{text_content[:MAX_TEXT_FOR_SUMMARY]}
---
"""
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Si AI asistent na sumarizáciu študijných textov."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.3,
            max_tokens=400,
        )
        return {"summary": completion.choices[0].message.content.strip(), "error": None}

    except Exception as e:  # pylint: disable=broad-except
        logger.error("OpenAI summarization failed: %s", e, exc_info=True)
        return {"summary": None, "error": str(e)}


# ───────────────────────────────
#              TAGS
# ───────────────────────────────
def extract_tags_from_text(text_content: str) -> List[str]:
    if not openai_client:
        return []

    prompt = f"""
Zo študijného textu vyber 3-5 najrelevantnejších tagov (jednoslovné alebo
krátke viacslovné výrazy) v slovenčine. Vráť ich ako čiarkou alebo
novým riadkom oddelený zoznam bez úvodných '#'.

--- TEXT ---
{text_content[:5_000]}
---
"""
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Si AI na kategorizovanie textov."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.4,
            max_tokens=120,
        )
        raw = completion.choices[0].message.content.strip()
        tags = [t.strip().lstrip("#") for t in re.split(r"[,\n]+", raw) if t.strip()]
        return tags[:5]

    except Exception as e:  # pylint: disable=broad-except
        logger.error("Tag extraction failed: %s", e, exc_info=True)
        return []
