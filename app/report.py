def render_markdown(result: dict) -> str:
    recommendation = result.get("recommendation") or {}
    auth = result.get("authorization", "")
    applied = result.get("applied", False)
    lines = [
        "# RED Control Tower result",
        "",
        f"**Scenario:** {result.get('scenario_id', '')}",
        f"**Model:** {result.get('model', '')}",
        "",
        "## Diagnosis",
        "",
        str(result.get("diagnosis", "")),
        "",
        "## Recommendation",
        "",
        str(recommendation.get("text", "")),
        "",
        f"- **Action:** {recommendation.get('action', '')}",
        f"- **Passenger-minutes (20 min):** {recommendation.get('passenger_minutes', '')}",
        f"- **Reduction vs baseline:** {recommendation.get('reduction_percent', 0)}%",
        f"- **Explanation source:** {result.get('explanation_source', '')}",
        "",
        "## Alternatives",
        "",
    ]
    alternatives = result.get("alternatives") or []
    if not alternatives:
        lines.append("_None_")
    else:
        for alt in alternatives:
            lines.append(
                f"- `{alt.get('action')}`: {alt.get('passenger_minutes')} "
                f"passenger-minutes; cost {alt.get('cost')}; risk {alt.get('risk')}"
            )
    lines.extend(
        [
            "",
            "## Authorization",
            "",
            f"- **Status:** {auth}",
            f"- **Operator decision:** {result.get('operator_decision')}",
            f"- **Applied:** {applied}",
            "",
            "## Limitations",
            "",
        ]
    )
    for item in result.get("limitations") or []:
        lines.append(f"- {item}")
    lines.append("")
    return "\n".join(lines)
