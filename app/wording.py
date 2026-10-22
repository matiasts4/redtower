"""Spanish operator-facing sentences."""


def _format_int(n: int) -> str:
    text = f"{n:,}".replace(",", ".")
    return text


def diagnosis_text(classification: dict, impact: dict) -> str:
    incident_type = classification.get("incident_type")
    if incident_type not in ("road_block", "stopped_bus", "demand_surge"):
        return ""

    routes = impact.get("routes", [])
    stops = impact.get("stops", [])
    passengers = impact.get("passengers_by_horizon", {}).get(20, 0)
    route_count = len(routes)
    stop_count = len(stops)
    route_word = {1: "un", 2: "dos", 3: "tres", 4: "cuatro"}.get(
        route_count, str(route_count)
    )
    stop_word = {
        1: "un",
        2: "dos",
        3: "tres",
        4: "cuatro",
        5: "cinco",
        6: "seis",
        7: "siete",
        8: "ocho",
        9: "nueve",
    }.get(stop_count, str(stop_count))
    return (
        f"El incidente probablemente es real. Afecta a {route_word} recorridos, "
        f"{stop_word} paraderos y aproximadamente {_format_int(passengers)} pasajeros "
        f"durante los próximos 20 minutos."
    )


def recommendation_text(ranked: dict, classification: dict) -> str:
    status = classification.get("status")
    incident_type = classification.get("incident_type")
    action = ranked.get("recommended_action")

    if status == "insufficient" or incident_type == "unconfirmed":
        return "Evidencia insuficiente. No recomiendo modificar la operación."

    if status == "clear" or incident_type == "none":
        return (
            "La operación del corredor está dentro de lo esperado. "
            "No recomiendo modificar el servicio."
        )

    if action == "relief_and_divert_210":
        pct = ranked.get("reduction_percent", 0)
        return (
            "Enviar un bus de refuerzo y desviar temporalmente el recorrido 210. "
            f"Esta opción reduce el impacto estimado en {pct}% frente a esperar."
        )

    if action == "dispatch_relief":
        return (
            "Enviar un bus de refuerzo. Esta opción reduce el impacto estimado "
            "frente a esperar."
        )

    if action == "divert_210":
        return (
            "Desviar temporalmente el recorrido 210. Esta opción reduce el impacto "
            "estimado frente a esperar."
        )

    if action == "wait":
        return "Esperar y monitorear. Esta opción mantiene la operación actual."

    return "Mantener la operación actual."
