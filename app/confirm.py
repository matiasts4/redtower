"""Deterministic incident confirmation from query bundles."""

SLOW_SPEED_KMH = 5


def _latest_positions(rows: list[dict]) -> dict[str, dict]:
    latest: dict[str, dict] = {}
    for row in rows:
        vehicle_id = row["vehicle_id"]
        if vehicle_id not in latest or row["timestamp"] > latest[vehicle_id]["timestamp"]:
            latest[vehicle_id] = row
    return latest


def _has_high_road_block(events: list[dict]) -> bool:
    for row in events:
        if row.get("severity") == "high" and row.get("type") == "road_block":
            return True
    return False


def _camera_blocked(cameras: list[dict]) -> bool:
    return any(row.get("state") == "blocked" for row in cameras)


def _slow_vehicle_ids(positions: list[dict]) -> list[str]:
    latest = _latest_positions(positions)
    return sorted(
        vid
        for vid, row in latest.items()
        if float(row["speed_kmh"]) <= SLOW_SPEED_KMH
    )


def _waiting_total(demand: list[dict]) -> int:
    return sum(int(row["waiting_passengers"]) for row in demand)


def _road_block_evidence(
    reports: list[dict], slow_ids: list[str], cameras: list[dict], events: list[dict]
) -> list[str]:
    evidence: list[str] = []
    for row in reports:
        evidence.append(row["report_id"])
    for vid in slow_ids:
        evidence.append(vid)
    for row in cameras:
        if row.get("state") == "blocked":
            evidence.append(row["camera_id"])
    for row in events:
        if row.get("severity") == "high" and row.get("type") == "road_block":
            evidence.append(row["event_id"])
    return evidence


def classify(bundle: dict) -> dict:
    reports = bundle.get("reports", [])
    road_events = bundle.get("road_events", [])
    cameras = bundle.get("cameras", [])
    positions = bundle.get("positions", [])
    demand = bundle.get("demand", [])

    high_block = _has_high_road_block(road_events)
    camera_blocked = _camera_blocked(cameras)
    slow_ids = _slow_vehicle_ids(positions)
    report_count = len(reports)

    if (
        high_block
        and camera_blocked
        and len(slow_ids) >= 3
        and report_count >= 2
    ):
        return {
            "status": "real",
            "incident_type": "road_block",
            "confidence": 0.86,
            "evidence_ids": _road_block_evidence(
                reports, slow_ids, cameras, road_events
            ),
        }

    if len(slow_ids) == 1 and not high_block:
        evidence = slow_ids.copy()
        return {
            "status": "real",
            "incident_type": "stopped_bus",
            "confidence": 0.81,
            "evidence_ids": evidence,
        }

    if _waiting_total(demand) >= 150 and not slow_ids:
        return {
            "status": "real",
            "incident_type": "demand_surge",
            "confidence": 0.77,
            "evidence_ids": [],
        }

    if report_count >= 1:
        return {
            "status": "insufficient",
            "incident_type": "unconfirmed",
            "confidence": 0.24,
            "evidence_ids": [row["report_id"] for row in reports],
        }

    return {
        "status": "clear",
        "incident_type": "none",
        "confidence": 0.93,
        "evidence_ids": [],
    }
