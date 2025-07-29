# ai_service/study_plan_generator.py
"""
AI-powered generovanie študijného plánu.
Ak OpenAI zlyhá alebo vráti nekorektné dáta, vracia None.
"""

from __future__ import annotations
import os, json, logging, asyncio
from datetime import date, datetime, timedelta
from typing import List, Dict, Any

from openai import AsyncOpenAI

log = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ----------  PUBLIC API  -------------------------------------------------- #
async def build_plan(
    topics: List[Dict[str, Any]],
    prefs: Dict[str, Any] | None = None,
    review: bool = True,
) -> List[Dict[str, Any]] | None:
    """
    :param topics: [{id,title,difficulty(0-1),estMinutes,prereqIds:[]}]
    :param prefs : {dailyMinutes:int, startISO:str, skipWeekends:bool}
    :return: [{topicId,dateISO,duration}]
    """

    if not topics:
        return []

    prefs = prefs or {}
    daily = prefs.get("dailyMinutes", 120)
    start = date.fromisoformat(prefs.get("startISO") or (date.today() + timedelta(days=1)).isoformat())

    prompt = _build_prompt(topics, daily, start, review)

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=900,
            messages=[{"role": "user", "content": prompt}],
        )
        plan = json.loads(resp.choices[0].message.content)
        _validate(plan)
        return plan
    except Exception as exc:
        log.warning("AI study-plan generation failed → fallback (%s)", exc)
        return None

# ----------  HELPERS  ----------------------------------------------------- #
def _build_prompt(topics, daily, start, review):
    prompt = (
        "You are an expert study-plan assistant. "
        "Build a JSON array of study blocks for a learner.\n"
        f"Start date (ISO): {start.isoformat()}\n"
        f"Maximum study minutes per day: {daily}\n"
        "Rules:\n"
        "1. Respect topic prerequisites – a topic must be scheduled **after** all its prereqIds.\n"
        "2. Distribute workload evenly; never exceed the daily limit.\n"
        "3. For each topic, schedule a first-study block. "
    )
    if review:
        prompt += (
            "Also add two review blocks: 3 and 7 days after the first block.\n"
            "Mark reviews with key `isReview:true`.\n"
        )
    prompt += (
        "Return an array of objects: "
        "[{topicId:int, dateISO:str, duration:int (minutes), isReview?:bool}]\n"
        "Here is the topic list:\n"
        + json.dumps(topics, indent=2)
    )
    return prompt


def _validate(plan):
    if not isinstance(plan, list):
        raise ValueError("Plan is not list")
    for b in plan:
        if not {"topicId", "dateISO", "duration"} <= b.keys():
            raise ValueError("Bad block schema")
