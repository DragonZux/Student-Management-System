from typing import Any, Dict, List, Optional


def _normalize_slot(slot: Any) -> Optional[Dict[str, str]]:
    # Accept dicts or pydantic models (e.g. ScheduleSlot).
    if hasattr(slot, "model_dump"):
        slot = slot.model_dump()
    day = slot.get("day") or slot.get("weekday")
    start = slot.get("start") or slot.get("start_time")
    end = slot.get("end") or slot.get("end_time")
    if not day or not start or not end:
        return None
    return {"day": str(day), "start": str(start), "end": str(end)}


def _time_to_minutes(value: str) -> int:
    hour, minute = value.split(":", 1)
    return int(hour) * 60 + int(minute)


def schedules_conflict(schedule_a: List[Any], schedule_b: List[Any]) -> bool:
    normalized_a = [slot for slot in (_normalize_slot(s) for s in schedule_a) if slot]
    normalized_b = [slot for slot in (_normalize_slot(s) for s in schedule_b) if slot]
    for a in normalized_a:
        for b in normalized_b:
            if a["day"] != b["day"]:
                continue
            a_start = _time_to_minutes(a["start"])
            a_end = _time_to_minutes(a["end"])
            b_start = _time_to_minutes(b["start"])
            b_end = _time_to_minutes(b["end"])
            if a_start < b_end and b_start < a_end:
                return True
    return False
