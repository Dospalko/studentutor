# app/services/ai_service/study_plan_generator.py
from __future__ import annotations
import logging
from datetime import date, datetime, timedelta, time
from typing import List, Dict, Any
import math

log = logging.getLogger(__name__)

def _clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))

def _is_working_day(d: date, working_days: set[int]) -> bool:
    return d.weekday() in working_days

def _next_working_day(d: date, working_days: set[int]) -> date:
    while not _is_working_day(d, working_days):
        d += timedelta(days=1)
    return d

async def build_plan(
    topics: List[Dict[str, Any]],
    prefs: Dict[str, Any] | None = None,
) -> List[Dict[str, Any]] | None:
    """
    Deterministické plánovanie:
      - viaceré bloky denne až do vyčerpania dailyMinutes
      - rozdeľovanie tém na sedenia (25–60 min, podľa náročnosti)
      - preskakovanie víkendov (ak includeWeekends=False)
      - recenzie po 1/3/7 dňoch
    Výstup: [{ "topicId": int, "dateISO": "YYYY-MM-DDTHH:MM:SS", "duration": int, "isReview": bool? }]
    """
    if not topics:
        return []

    p = prefs or {}

    # --------- voľby s rozumnými defaultmi ----------
    daily_minutes: int = int(p.get("dailyMinutes", 120))
    start_date: date = date.fromisoformat(p.get("startISO") or (date.today() + timedelta(days=1)).isoformat())

    include_weekends: bool = bool(p.get("includeWeekends", False))
    # workingDays: množina 0..6 (Mon..Sun)
    working_days = set(range(7)) if include_weekends else set(range(0, 5))

    # časy v rámci dňa
    day_start_hour: int = int(p.get("dayStartHour", 17))   # začíname napr. 17:00
    break_minutes: int = int(p.get("breakMinutes", 10))    # pauza medzi sedeniami

    # dĺžky sedení
    session_min: int = int(p.get("sessionMin", 25))
    session_max: int = int(p.get("sessionMax", 60))

    # recenzie
    review_offsets: List[int] = list(p.get("reviewDays", [1, 3, 7]))
    base_review_minutes: int = int(p.get("reviewMinutes", 15))

    # --------- príprava tém ----------
    # očakáva: {id, title?, difficulty(0..1), estMinutes, prereqIds?}
    items: List[Dict[str, Any]] = []
    for t in topics:
        est = int(t.get("estMinutes") or t.get("estminutes") or t.get("est_minutes") or 60)
        diff = float(t.get("difficulty", 0.5))
        # kratšie sedenia pre ťažšie témy
        target_len = int(round(50 - 20 * (diff - 0.5)))  # diff 0.2→56 min, 0.8→44 min
        target_len = _clamp(target_len, session_min, session_max)
        remaining = max(est, session_min)
        items.append({
            "topicId": int(t["id"]),
            "difficulty": diff,
            "remaining": remaining,
            "target_len": target_len,
            "est_total": remaining,
            "title": t.get("title"),
        })

    # stabilné poradie: najprv podľa náročnosti (ťažšie skôr), potom podľa id
    items.sort(key=lambda x: (-x["difficulty"], x["topicId"]))

    # per‑deň kapacity a bloky
    day_used: Dict[date, int] = {}
    day_blocks: Dict[date, List[Dict[str, Any]]] = {}

    def _ensure_day(d: date):
        if d not in day_used:
            day_used[d] = 0
            day_blocks[d] = []

    def _add_block(d: date, duration: int, payload: Dict[str, Any]) -> bool:
        """Skúsi pridať blok do dňa d; ak sa nezmestí, vráti False."""
        _ensure_day(d)
        if day_used[d] + duration > daily_minutes:
            return False
        # čas v rámci dňa = start + sum(durations + breaks)
        start_min = 0
        for b in day_blocks[d]:
            start_min += b["duration"] + break_minutes
        start_dt = datetime.combine(d, time(hour=day_start_hour)) + timedelta(minutes=start_min)
        b = {"dateISO": start_dt.isoformat(), "duration": duration, **payload}
        day_blocks[d].append(b)
        day_used[d] += duration
        return True

    # rotujúci výber tém (round‑robin), aby sa nemlelo „jeden deň = jedna téma“
    active_indices = [i for i, it in enumerate(items) if it["remaining"] > 0]
    cur_idx = 0
    cur_day = _next_working_day(start_date, working_days)

    safety = 0
    while active_indices and safety < 100000:
        safety += 1
        _ensure_day(cur_day)
        remaining_today = daily_minutes - day_used[cur_day]
        if remaining_today <= session_min:
            # ďalší pracovný deň
            cur_day = _next_working_day(cur_day + timedelta(days=1), working_days)
            continue

        i = active_indices[cur_idx]
        it = items[i]
        # veľkosť sedenia = min(target, remaining topic, kapacita dňa)
        sess = min(it["target_len"], it["remaining"], remaining_today)
        # neklaď príliš malé chvostíky
        if it["remaining"] - sess < session_min and it["remaining"] > sess:
            # zväčšiť posledné sedenie ak sa zmestí
            extra = min(remaining_today - sess, it["remaining"] - sess)
            sess += max(0, extra)

        ok = _add_block(cur_day, sess, {"topicId": it["topicId"]})
        if not ok:
            # deň plný → posuň deň
            cur_day = _next_working_day(cur_day + timedelta(days=1), working_days)
            continue

        it["remaining"] -= sess
        if it["remaining"] <= 0:
            # dokončené → plánuj recenzie
            for k, off in enumerate(review_offsets):
                review_day = _next_working_day(cur_day + timedelta(days=off), working_days)
                # skúšaj napchať, a ak sa nezmestí, hľadaj ďalší deň
                review_minutes = _clamp(
                    int(round(base_review_minutes * (1.2 if it["difficulty"] > 0.7 else 1.0))),
                    session_min // 2, session_min
                )
                tries = 0
                while not _add_block(review_day, review_minutes, {"topicId": it["topicId"], "isReview": True}):
                    review_day = _next_working_day(review_day + timedelta(days=1), working_days)
                    tries += 1
                    if tries > 14:
                        break
            # vyhoď z aktívnych
            active_indices.remove(i)
            if active_indices:
                cur_idx %= len(active_indices)
        else:
            # posuň sa na ďalšiu tému
            cur_idx = (cur_idx + 1) % len(active_indices)

    # zlož výstup
    out: List[Dict[str, Any]] = []
    for d in sorted(day_blocks.keys()):
        # bloky už majú presný dateISO (s časom) v poradí
        out.extend(day_blocks[d])

    return out
