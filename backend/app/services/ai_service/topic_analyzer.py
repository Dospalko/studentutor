
# =============================
# backend/app/services/topic_analyzer.py
# =============================

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ValidationError

from app.db.models.topic import Topic as TopicModel
from app.db.models.study_material import StudyMaterial as StudyMaterialModel
from app.services.ai_service.openai_service import client as openai_client

logger = logging.getLogger(__name__)

# -- Nastavenia ---------------------------------------------------------------
OPENAI_MODEL_NAME = "gpt-3.5-turbo"  # Jediný riadok, kde meníš použitý model
USER_AI_BLEND_RATIO = 0.5          # 50 % váha pre používateľa, 50 % pre AI
JSON_PARSE_PATTERN = re.compile(r"\{.*\}", re.DOTALL)  # Regex fallback

# -- Dátové štruktúry ---------------------------------------------------------
class AIAnalysis(BaseModel):
    """Štruktúra očakávanej LLM odpovede."""

    difficulty_score: float
    estimated_duration_minutes: int
    key_concepts: List[str]
    practice_questions: List[str]


# -- Pomocné funkcie ----------------------------------------------------------

def extract_text_from_material(material: StudyMaterialModel) -> Optional[str]:
    """Načítaj stručný textový výňatok z materiálu.

    * **text/plain** – vráti title + description uložené v DB.
    * **pdf** – zatiaľ len placeholder (doplň vlastnú extrakciu).
    """

    logger.debug("Extracting text preview from %s (%s)", material.file_name, material.file_type)

    if material.file_type == "text/plain":
        return f"{material.title or ''}\n{material.description or ''}".strip()

    if "pdf" in (material.file_type or ""):
        logger.warning("PDF extraction for %s not implemented", material.file_name)
        return f"{material.title or ''}\n{material.description or ''}".strip()

    # TODO: DOCX, PPTX, obrázky, …
    return None


def _build_prompt(
    *,
    topic_name: str,
    user_strengths: Optional[str],
    user_weaknesses: Optional[str],
    user_estimated_difficulty: Optional[float],
    material_summaries: Optional[str],
) -> str:
    """Zostrojí prompt v slovenčine pre OpenAI."""

    parts: List[str] = [f"Analyzuj nasledujúcu študijnú tému: „{topic_name}”."]

    if user_strengths:
        parts.append(f"Silné stránky používateľa: {user_strengths}.")
    if user_weaknesses:
        parts.append(f"Slabé stránky používateľa: {user_weaknesses}.")
    if user_estimated_difficulty is not None:
        parts.append(
            f"Používateľ odhaduje náročnosť na {user_estimated_difficulty:.2f} (škála 0–1)."
        )

    if material_summaries:
        parts.append("\nTrimnutý obsah priradených materiálov (do 2000 znak.):")
        parts.append(material_summaries[:2000])

    parts += [
        "\nNa základe uvedeného vráť čistý JSON s kľúčmi:",
        "difficulty_score – float 0‑1",
        "estimated_duration_minutes – int",
        "key_concepts – list str",
        "practice_questions – list str",
    ]

    return "\n".join(parts)


def _blend_difficulty(ai_score: float, user_score: Optional[float]) -> float:
    """Spojí AI odhad s používateľovým odhadom podľa USER_AI_BLEND_RATIO."""

    if user_score is None:
        return ai_score
    return (ai_score * (1 - USER_AI_BLEND_RATIO)) + (user_score * USER_AI_BLEND_RATIO)


# -- Verejná API --------------------------------------------------------------

def analyze_topic_with_openai(
    *,
    topic_name: str,
    user_strengths: Optional[str] = None,
    user_weaknesses: Optional[str] = None,
    user_estimated_difficulty: Optional[float] = None,
    material_texts: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Zavolá OpenAI a vráti normalizovaný slovník s výsledkami."""

    if openai_client is None:
        logger.error("OpenAI client missing – returning defaults")
        return {
            "ai_difficulty_score": 0.5,
            "ai_estimated_duration": 60,
            "key_concepts": [],
            "practice_questions": [],
            "error": "OpenAI client not initialised",
        }

    prompt = _build_prompt(
        topic_name=topic_name,
        user_strengths=user_strengths,
        user_weaknesses=user_weaknesses,
        user_estimated_difficulty=user_estimated_difficulty,
        material_summaries="\n\n".join(material_texts or []).strip(),
    )

    try:
        completion = openai_client.chat.completions.create(
            model=OPENAI_MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Si expert na analýzu študijných tém a tvorbu edukatívneho obsahu. "
                        "Vráť výhradne JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=400,
            response_format={"type": "json_object"},
        )

        raw = completion.choices[0].message.content
        logger.debug("Raw LLM response: %s", raw)

        # --- Robustné parsovanie ------------------------------------------------
        match = JSON_PARSE_PATTERN.search(raw or "")
        if not match:
            raise ValueError("LLM nevrátil JSON objekt")

        parsed: AIAnalysis = AIAnalysis.model_validate_json(match.group())

        return {
            "ai_difficulty_score": parsed.difficulty_score,
            "ai_estimated_duration": parsed.estimated_duration_minutes,
            "key_concepts": parsed.key_concepts,
            "practice_questions": parsed.practice_questions,
            "error": None,
        }

    except (ValidationError, ValueError, json.JSONDecodeError) as exc:
        logger.exception("Parsing error: %s", exc)
        return {
            "ai_difficulty_score": 0.5,
            "ai_estimated_duration": 60,
            "key_concepts": [],
            "practice_questions": [],
            "error": f"Parsing error: {exc}",
        }
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("LLM call failed: %s", exc)
        return {
            "ai_difficulty_score": 0.5,
            "ai_estimated_duration": 60,
            "key_concepts": [],
            "practice_questions": [],
            "error": str(exc),
        }


def update_topic_with_ai_analysis(
    db_topic: TopicModel,
    db_materials: Optional[List[StudyMaterialModel]] = None,
) -> None:
    """Aktualizuje ORM objekt *pred* commitom."""

    material_texts = [
        preview
        for m in db_materials or []
        if (preview := extract_text_from_material(m))
    ]

    ai = analyze_topic_with_openai(
        topic_name=db_topic.name,
        user_strengths=getattr(db_topic, "user_strengths", None),
        user_weaknesses=getattr(db_topic, "user_weaknesses", None),
        user_estimated_difficulty=getattr(db_topic, "user_estimated_difficulty", None),
        material_texts=material_texts or None,
    )

    # --- Ukladáme výsledky ------------------------------------------------------
    db_topic.ai_difficulty_score = ai["ai_difficulty_score"]
    db_topic.ai_estimated_duration = ai["ai_estimated_duration"]

    # Finálny blended score (pridaj stĺpec `difficulty_final` do tabuľky Topic)
    db_topic.difficulty_final = _blend_difficulty(
        ai["ai_difficulty_score"], getattr(db_topic, "user_estimated_difficulty", None)
    )

    # Nepovinné: Ulož si aj key_concepts / practice_questions podľa potreby.
    # db_topic.ai_key_concepts_json = json.dumps(ai["key_concepts"])
    # db_topic.ai_practice_questions_json = json.dumps(ai["practice_questions"])

    if ai["error"]:
        logger.warning("AI analysis returned error for topic %s: %s", db_topic.id or "NEW", ai["error"])

