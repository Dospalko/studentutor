from __future__ import annotations
import os, json, logging
from datetime import date, timedelta
from typing import List, Dict, Any
from openai import AsyncOpenAI

log = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def build_plan(
    topics: List[Dict[str, Any]],
    prefs: Dict[str, Any] | None = None,
) -> List[Dict[str, Any]] | None:
    if not topics:
        return []
    prefs = prefs or {}
    daily = prefs.get("dailyMinutes", 120)
    start = date.fromisoformat(prefs.get("startISO") or (date.today() + timedelta(days=1)).isoformat())
    prompt = (
        "You are an expert study-plan assistant. "
        "Return JSON array of study blocks [{topicId,dateISO,duration,isReview?}].\n"
        f"Start:{start} DailyLimit:{daily}\n"
        + json.dumps(topics, ensure_ascii=False)
    )
    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            max_tokens=900,
            messages=[{"role": "user", "content": prompt}],
        )
        plan = json.loads(resp.choices[0].message.content)
        if isinstance(plan, list):
            return plan
    except Exception as e:
        log.warning("AI plan failed: %s", e)
    return None
