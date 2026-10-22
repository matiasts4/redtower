"""Rank operational alternatives by passenger-minutes at horizon 20."""


def rank(alternatives: list[dict]) -> dict:
    if not alternatives:
        raise ValueError("alternatives must not be empty")

    baseline_action = "wait" if any(a["action"] == "wait" for a in alternatives) else "hold"
    baseline = next(a for a in alternatives if a["action"] == baseline_action)
    baseline_pm = baseline["passenger_minutes"]

    winner = min(alternatives, key=lambda row: row["passenger_minutes"])
    saved = baseline_pm - winner["passenger_minutes"]
    if baseline_pm == 0:
        reduction_percent = 0
    else:
        reduction_percent = saved * 100 // baseline_pm

    return {
        "recommended_action": winner["action"],
        "passenger_minutes": winner["passenger_minutes"],
        "baseline_passenger_minutes": baseline_pm,
        "saved": saved,
        "reduction_percent": reduction_percent,
    }
