"""Queue simulation and operational action catalog."""

RELIEF_BOARD_PER_MIN = 36
RANK_HORIZON = 20

ACTION_META = {
    "hold": {"cost": "low", "risk": "low"},
    "wait": {"cost": "low", "risk": "high"},
    "divert_210": {"cost": "medium", "risk": "medium"},
    "dispatch_relief": {"cost": "high", "risk": "medium"},
    "relief_and_divert_210": {"cost": "high", "risk": "medium"},
}

CATALOG = {
    "clear": ["hold"],
    "none": ["hold"],
    "unconfirmed": ["hold"],
    "road_block": ["wait", "divert_210", "dispatch_relief", "relief_and_divert_210"],
    "stopped_bus": ["wait", "dispatch_relief"],
    "demand_surge": ["wait", "dispatch_relief"],
}


def queue_passenger_minutes(
    waiting: int, arrival_per_min: int, board_per_min: int, horizon: int
) -> int:
    total = 0
    queue = waiting
    for _ in range(horizon):
        total += queue
        boarded = min(queue, board_per_min)
        queue = max(0, queue - boarded + arrival_per_min)
    return total


def queue_timeline(
    waiting: int, arrival_per_min: int, board_per_min: int, horizon: int
) -> list[int]:
    timeline = []
    queue = waiting
    for _ in range(horizon):
        timeline.append(queue)
        boarded = min(queue, board_per_min)
        queue = max(0, queue - boarded + arrival_per_min)
    timeline.append(queue)
    return timeline


def catalog_for(incident_type: str) -> list[str]:
    return list(CATALOG[incident_type])


def action_rates(action: str, measured: dict) -> dict:
    arrival = measured["arrival_per_min"]
    board = measured["board_per_min"]
    route_210 = measured.get("route_210_arrival_per_min", 0)
    if action in ("hold", "wait"):
        return {"arrival_per_min": arrival, "board_per_min": board}
    if action == "divert_210":
        return {"arrival_per_min": arrival - route_210, "board_per_min": board}
    if action == "dispatch_relief":
        return {
            "arrival_per_min": arrival,
            "board_per_min": board + RELIEF_BOARD_PER_MIN,
        }
    if action == "relief_and_divert_210":
        return {
            "arrival_per_min": arrival - route_210,
            "board_per_min": board + RELIEF_BOARD_PER_MIN,
        }
    raise KeyError(action)


def build_alternatives(impact: dict, incident_type: str) -> list[dict]:
    waiting = impact["waiting"]
    measured = {
        "arrival_per_min": impact["arrival_per_min"],
        "board_per_min": impact["board_per_min"],
        "route_210_arrival_per_min": impact.get("route_210_arrival_per_min", 0),
    }
    alternatives = []
    for action in catalog_for(incident_type):
        rates = action_rates(action, measured)
        passenger_minutes = queue_passenger_minutes(
            waiting,
            rates["arrival_per_min"],
            rates["board_per_min"],
            RANK_HORIZON,
        )
        timeline = queue_timeline(
            waiting,
            rates["arrival_per_min"],
            rates["board_per_min"],
            RANK_HORIZON,
        )
        meta = ACTION_META[action]
        alternatives.append(
            {
                "action": action,
                "passenger_minutes": passenger_minutes,
                "cost": meta["cost"],
                "risk": meta["risk"],
                "queue_series": timeline,
            }
        )
    return alternatives
