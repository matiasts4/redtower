"""Passenger impact measurement for a classified incident."""

from app.confirm import SLOW_SPEED_KMH, _latest_positions

HORIZONS = (10, 20, 30)


def _stop_order(stops: list[dict]) -> dict[str, int]:
    return {row["stop_id"]: int(row["corridor_order"]) for row in stops}


def _routes_with_both_stops(stop_sequence: list[dict], a: str, b: str) -> list[str]:
    by_route: dict[str, set[str]] = {}
    for row in stop_sequence:
        by_route.setdefault(row["route_id"], set()).add(row["stop_id"])
    routes = []
    for route_id, stop_ids in sorted(by_route.items()):
        if a in stop_ids and b in stop_ids:
            routes.append(route_id)
    return routes


def _stops_in_order_range(
    stops: list[dict], low_order: int, high_order: int
) -> list[str]:
    ordered = sorted(stops, key=lambda row: int(row["corridor_order"]))
    return [
        row["stop_id"]
        for row in ordered
        if low_order <= int(row["corridor_order"]) <= high_order
    ]


def _route_stops(stop_sequence: list[dict], route_id: str) -> list[str]:
    rows = [row for row in stop_sequence if row["route_id"] == route_id]
    rows.sort(key=lambda row: int(row["sequence_order"]))
    return [row["stop_id"] for row in rows]


def _stopped_bus_window(
    stops: list[dict], stop_sequence: list[dict], positions: list[dict]
) -> tuple[list[str], list[str]]:
    latest = _latest_positions(positions)
    slow = [
        row
        for row in latest.values()
        if float(row["speed_kmh"]) <= SLOW_SPEED_KMH
    ]
    if len(slow) != 1:
        return [], []
    vehicle = slow[0]
    route_id = vehicle["route_id"]
    nearest = vehicle["nearest_stop"]
    order_map = _stop_order(stops)
    start_order = order_map[nearest]
    stop_ids = _stops_in_order_range(stops, start_order, start_order + 3)
    return [route_id], stop_ids


def _demand_surge_scope(demand: list[dict], stop_sequence: list[dict]) -> tuple[list[str], list[str]]:
    hot_stops = [
        row["stop_id"]
        for row in demand
        if int(row["waiting_passengers"]) >= 40
    ]
    hot_set = set(hot_stops)
    routes = _routes_with_stops(stop_sequence, hot_set)
    return routes, sorted(hot_stops)


def _routes_with_stops(stop_sequence: list[dict], stop_ids: set[str]) -> list[str]:
    by_route: dict[str, set[str]] = {}
    for row in stop_sequence:
        by_route.setdefault(row["route_id"], set()).add(row["stop_id"])
    routes = []
    for route_id, route_stops in sorted(by_route.items()):
        if route_stops & stop_ids:
            routes.append(route_id)
    return routes


def _empty_impact() -> dict:
    return {
        "routes": [],
        "stops": [],
        "waiting": 0,
        "arrival_per_min": 0,
        "route_210_arrival_per_min": 0,
        "board_per_min": 0,
        "moving_buses": 0,
        "slow_vehicle_ids": [],
        "passengers_by_horizon": {h: 0 for h in HORIZONS},
    }


def measure(bundle: dict, classification: dict) -> dict:
    incident_type = classification["incident_type"]
    if incident_type in ("none", "unconfirmed"):
        return _empty_impact()

    stops = bundle["stops"]
    stop_sequence = bundle["stop_sequence"]
    demand = bundle["demand"]
    positions = bundle["positions"]

    if incident_type == "road_block":
        routes = _routes_with_both_stops(stop_sequence, "STOP_09", "STOP_10")
        affected_stops = _stops_in_order_range(stops, 6, 14)
    elif incident_type == "stopped_bus":
        routes, affected_stops = _stopped_bus_window(stops, stop_sequence, positions)
    elif incident_type == "demand_surge":
        routes, affected_stops = _demand_surge_scope(demand, stop_sequence)
    else:
        return _empty_impact()

    affected_set = set(affected_stops)
    demand_rows = [row for row in demand if row["stop_id"] in affected_set]
    waiting = sum(int(row["waiting_passengers"]) for row in demand_rows)
    arrival = sum(int(row["arrival_per_min"]) for row in demand_rows)
    route_210_arrival = sum(int(row["route_210_arrival_per_min"]) for row in demand_rows)

    latest = _latest_positions(positions)
    slow_ids = sorted(
        vid
        for vid, row in latest.items()
        if float(row["speed_kmh"]) <= SLOW_SPEED_KMH
    )
    moving = 0
    for row in latest.values():
        if float(row["speed_kmh"]) > SLOW_SPEED_KMH and row["nearest_stop"] in affected_set:
            moving += 1

    board = moving * 12
    passengers_by_horizon = {
        h: waiting + arrival * h for h in HORIZONS
    }

    return {
        "routes": routes,
        "stops": affected_stops,
        "waiting": waiting,
        "arrival_per_min": arrival,
        "route_210_arrival_per_min": route_210_arrival,
        "board_per_min": board,
        "moving_buses": moving,
        "slow_vehicle_ids": slow_ids,
        "passengers_by_horizon": passengers_by_horizon,
    }
