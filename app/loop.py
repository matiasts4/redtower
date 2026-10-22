import json

from app.approval import authorize
from app.confirm import classify
from app.fixture import FALSE_REPORT_SENTENCE
from app.impact import measure
from app.judge import rank
from app.scenarios import build_alternatives, catalog_for
from app.store import QUERY_NAMES
from app.switch import ROLE_SYSTEMS
from app.wording import diagnosis_text, recommendation_text

MAX_REPORTER_RETURNS = 2


def run_scenario(
    scenario_id: str, source, model, tracer, approved: bool = False
) -> dict:
    window = source.run("scenario_window", scenario_id)
    if not window:
        raise ValueError(f"Unknown scenario_id: {scenario_id}")

    planner_messages = [
        {"role": "system", "content": ROLE_SYSTEMS["planner"]},
        {
            "role": "user",
            "content": (
                f"Scenario {scenario_id}. Reply with JSON listing named queries to run."
            ),
        },
    ]
    _complete_and_log(
        model,
        tracer,
        "planner",
        scenario_id,
        planner_messages,
        action="select_queries",
        input_summary=f"Scenario {scenario_id}. The host runs every named query.",
        target_agent="host",
    )

    bundle: dict[str, list] = {}
    counts: list[str] = []
    for name in QUERY_NAMES:
        bundle[name] = source.run(name, scenario_id)
        counts.append(f"{name}={len(bundle[name])}")
    tracer.log(
        role="host",
        scenario_id=scenario_id,
        action="load_sources",
        input_summary=", ".join(QUERY_NAMES),
        output_summary=f"{type(source).__name__}: " + ", ".join(counts),
        target_agent="diagnostician",
        model="host",
    )

    classify_bundle = {
        "reports": bundle["reports"],
        "road_events": bundle["road_events"],
        "cameras": bundle["cameras"],
        "positions": bundle["positions"],
        "demand": bundle["demand"],
    }
    measure_bundle = {
        **classify_bundle,
        "stops": bundle["stops"],
        "stop_sequence": bundle["stop_sequence"],
    }

    classification = classify(classify_bundle)
    impact_full = measure(measure_bundle, classification)
    incident_type = classification["incident_type"]
    alternatives = build_alternatives(impact_full, incident_type)
    ranked = rank(alternatives)
    diagnosis = diagnosis_text(classification, impact_full)
    recommendation_sentence = recommendation_text(ranked, classification)
    auth = authorize(ranked, approved)
    evidence_ids = list(classification.get("evidence_ids") or [])

    host_context = _host_context(
        scenario_id=scenario_id,
        classification=classification,
        impact_full=impact_full,
        alternatives=alternatives,
        ranked=ranked,
        recommendation_sentence=recommendation_sentence,
        evidence_ids=evidence_ids,
        reports=bundle["reports"],
    )

    tracer.log(
        role="host",
        scenario_id=scenario_id,
        action="rank_alternatives",
        input_summary=f"incident={incident_type}",
        output_summary=(
            f"{ranked['recommended_action']} "
            f"{ranked['passenger_minutes']} vs {ranked['baseline_passenger_minutes']}"
        ),
        target_agent="diagnostician",
        model="host",
    )

    for role in ("diagnostician", "scenario", "judge"):
        _complete_and_log(
            model,
            tracer,
            role,
            scenario_id,
            _role_messages(role, host_context),
            action=role,
            input_summary=(
                f"Host action {ranked['recommended_action']} is final."
            ),
            target_agent="host",
        )

    reporter_draft = ""
    for attempt in range(MAX_REPORTER_RETURNS):
        reporter_draft = _complete_and_log(
            model,
            tracer,
            "reporter",
            scenario_id,
            _role_messages("reporter", host_context, reporter_draft),
            action="explain",
            input_summary="Cite a host evidence id. The host sentence is stored.",
            target_agent="host",
            retry_count=attempt,
            status="ok",
        )
        if _reporter_cites_evidence(reporter_draft, evidence_ids):
            break
        tracer.log(
            role="host",
            scenario_id=scenario_id,
            action="request_evidence_citation",
            input_summary="Reporter draft missed a host evidence id.",
            output_summary=reporter_draft,
            target_agent="reporter",
            model="host",
            retry_count=attempt,
            status="retry",
        )

    if not diagnosis:
        diagnosis = recommendation_sentence

    impact_out = {
        "routes": impact_full.get("routes", []),
        "stop_count": len(impact_full.get("stops", [])),
        "passengers_20": impact_full.get("passengers_by_horizon", {}).get(20, 0),
        "waiting": impact_full.get("waiting", 0),
        "arrival_per_min": impact_full.get("arrival_per_min", 0),
        "board_per_min": impact_full.get("board_per_min", 0),
        "moving_buses": impact_full.get("moving_buses", 0),
    }

    recommendation = {
        **ranked,
        "text": recommendation_sentence,
        "action": ranked["recommended_action"],
    }

    limitations = [
        "The system does not change routes.",
        "Recommendations require human approval before any operational change.",
    ]

    return {
        "scenario_id": scenario_id,
        "model": _model_name(model),
        "incident": classification,
        "impact": impact_out,
        "alternatives": alternatives,
        "recommendation": recommendation,
        "diagnosis": diagnosis,
        "evidence_ids": evidence_ids,
        "authorization": auth["authorization"],
        "operator_decision": auth["operator_decision"],
        "applied": auth["applied"],
        "limitations": limitations,
    }


def _complete_and_log(
    model,
    tracer,
    role: str,
    scenario_id: str,
    messages: list[dict],
    *,
    action: str,
    input_summary: str,
    target_agent: str,
    retry_count: int = 0,
    status: str = "ok",
) -> str:
    draft = model.complete(role, messages)
    tracer.log(
        role=role,
        scenario_id=scenario_id,
        action=action,
        input_summary=input_summary,
        output_summary=draft,
        target_agent=target_agent,
        model=_model_name(model),
        retry_count=retry_count,
        status=status,
    )
    return draft


def _model_name(model) -> str:
    if getattr(model, "name", "") == "fixture":
        return "fixture"
    reported = getattr(model, "model_id", None)
    if reported:
        return str(reported)
    return getattr(model, "name", "meterless")


def _host_context(
    *,
    scenario_id: str,
    classification: dict,
    impact_full: dict,
    alternatives: list[dict],
    ranked: dict,
    recommendation_sentence: str,
    evidence_ids: list[str],
    reports: list[dict],
) -> dict:
    return {
        "scenario_id": scenario_id,
        "classification": classification,
        "impact": impact_full,
        "alternatives": alternatives,
        "ranked": ranked,
        "recommendation_sentence": recommendation_sentence,
        "catalog": catalog_for(classification["incident_type"]),
        "evidence_ids": evidence_ids,
        "untrusted_reports": _untrusted_reports_block(reports),
    }


def _untrusted_reports_block(reports: list[dict]) -> str:
    if not reports:
        return "Untrusted report data:\n(none)"
    lines = ["Untrusted report data:"]
    for row in reports:
        description = row.get("description", "")
        lines.append(
            f"- {row.get('report_id', '')}: {description}"
        )
    return "\n".join(lines)


def _role_messages(role: str, context: dict, prior_reporter: str = "") -> list[dict]:
    payload = {
        "host_classification": context["classification"],
        "host_impact_summary": {
            "routes": context["impact"].get("routes", []),
            "stops": len(context["impact"].get("stops", [])),
            "passengers_20": context["impact"].get("passengers_by_horizon", {}).get(20, 0),
        },
        "host_alternatives": context["alternatives"],
        "host_ranking": context["ranked"],
        "host_recommendation": context["recommendation_sentence"],
        "host_catalog": context["catalog"],
        "host_evidence_ids": context["evidence_ids"],
    }
    user_parts = [
        f"Scenario {context['scenario_id']}. Host decision is final.",
        context["untrusted_reports"],
        "Host JSON (authoritative):",
        json.dumps(payload, ensure_ascii=False),
    ]
    if role == "reporter" and prior_reporter:
        user_parts.append(
            "Your previous draft did not cite a host evidence id. Try again."
        )
        user_parts.append(f"Previous draft:\n{prior_reporter}")
    return [
        {"role": "system", "content": ROLE_SYSTEMS[role]},
        {"role": "user", "content": "\n\n".join(user_parts)},
    ]


def _reporter_cites_evidence(text: str, evidence_ids: list[str]) -> bool:
    if not evidence_ids:
        return True
    return any(item in text for item in evidence_ids)


def system_messages_must_exclude_injection(systems: list[str]) -> bool:
    return all(FALSE_REPORT_SENTENCE not in text for text in systems)
