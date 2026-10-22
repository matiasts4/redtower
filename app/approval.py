"""Human approval gate — records decisions without applying route changes."""


def authorize(ranked: dict, approved: bool) -> dict:
    if approved:
        return {
            "authorization": "recorded",
            "operator_decision": "approve",
            "applied": False,
            "recommended_action": ranked.get("recommended_action"),
        }
    return {
        "authorization": "pending_human",
        "operator_decision": None,
        "applied": False,
        "recommended_action": ranked.get("recommended_action"),
    }
