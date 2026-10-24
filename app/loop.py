import json
import re

from app.approval import authorize
from app.confirm import (
    _camera_blocked,
    _has_high_road_block,
    _slow_vehicle_ids,
    _waiting_total,
    classify,
)
from app.impact import measure
from app.judge import rank
from app.scenarios import build_alternatives, catalog_for
from app.store import QUERY_NAMES
from app.switch import ROLE_SYSTEMS
from app.wording import diagnosis_text, recommendation_text

MAX_REPORTER_RETURNS = 2
MAX_PLANNER_ATTEMPTS = 2
MAX_DIAGNOSTICIAN_ATTEMPTS = 2

CORE_QUERIES = frozenset(
    {"positions", "reports", "cameras", "road_events", "demand"}
)

_CATALOG_LIST = list(QUERY_NAMES)


def run_scenario(
    scenario_id: str, source, model, tracer, approved: bool = False
) -> dict:
    window = source.run("scenario_window", scenario_id)
    if not window:
        raise ValueError(f"Unknown scenario_id: {scenario_id}")

    query_source, queries_to_run = _select_queries(
        model, tracer, scenario_id, source
    )

    bundle: dict[str, list] = {"scenario_window": window}
    counts: list[str] = []
    for name in queries_to_run:
        if name == "scenario_window":
            continue
        bundle[name] = source.run(name, scenario_id)
        counts.append(f"{name}={len(bundle[name])}")
    tracer.log(
        role="host",
        scenario_id=scenario_id,
        action="load_sources",
        input_summary=", ".join(queries_to_run),
        output_summary=f"{type(source).__name__}: " + ", ".join(counts),
        target_agent="diagnostician",
        model="host",
    )

    classify_bundle = {
        "reports": bundle.get("reports", []),
        "road_events": bundle.get("road_events", []),
        "cameras": bundle.get("cameras", []),
        "positions": bundle.get("positions", []),
        "demand": bundle.get("demand", []),
    }
    measure_bundle = {
        **classify_bundle,
        "stops": bundle.get("stops", []),
        "stop_sequence": bundle.get("stop_sequence", []),
    }

    classification_source, classification = _run_diagnostician(
        model,
        tracer,
        scenario_id,
        classify_bundle,
        bundle.get("reports", []),
    )

    impact_full = measure(measure_bundle, classification)
    incident_type = classification["incident_type"]
    alternatives = build_alternatives(impact_full, incident_type)
    ranked = rank(alternatives)
    diagnosis = diagnosis_text(classification, impact_full)
    recommendation_sentence = recommendation_text(ranked, classification)
    auth = authorize(ranked, approved)
    evidence_ids = list(classification.get("evidence_ids") or [])

    tracer.log(
        role="host",
        scenario_id=scenario_id,
        action="rank_alternatives",
        input_summary=f"incident={incident_type}",
        output_summary=(
            f"{ranked['recommended_action']} "
            f"{ranked['passenger_minutes']} vs {ranked['baseline_passenger_minutes']}"
        ),
        target_agent="scenario",
        model="host",
    )

    catalog = catalog_for(incident_type)
    _complete_and_log(
        model,
        tracer,
        "scenario",
        scenario_id,
        _scenario_messages(scenario_id, catalog, alternatives, ranked),
        action="scenario",
        input_summary=f"Catalog actions: {', '.join(catalog)}",
        target_agent="host",
    )

    judge_agreed, _judge_action = _run_judge(
        model, tracer, scenario_id, alternatives, ranked
    )

    explanation_source, recommendation_text_stored = _run_reporter(
        model,
        tracer,
        scenario_id,
        ranked,
        classification,
        recommendation_sentence,
        evidence_ids,
        bundle.get("reports", []),
    )

    if not diagnosis:
        diagnosis = recommendation_sentence

    impact_out = {
        "routes": impact_full.get("routes", []),
        "stop_count": len(impact_full.get("stops", [])),
        "stops": impact_full.get("stops", []),
        "slow_vehicle_ids": impact_full.get("slow_vehicle_ids", []),
        "passengers_20": impact_full.get("passengers_by_horizon", {}).get(20, 0),
        "waiting": impact_full.get("waiting", 0),
        "arrival_per_min": impact_full.get("arrival_per_min", 0),
        "board_per_min": impact_full.get("board_per_min", 0),
        "moving_buses": impact_full.get("moving_buses", 0),
    }

    recommendation = {
        **ranked,
        "text": recommendation_text_stored,
        "action": ranked["recommended_action"],
    }

    limitations = [
        "The system does not change routes.",
        "Recommendations require human approval before any operational change.",
    ]

    trace_file = getattr(getattr(tracer, "path", None), "name", None)

    return {
        "scenario_id": scenario_id,
        "trace_file": trace_file,
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
        "query_source": query_source,
        "classification_source": classification_source,
        "explanation_source": explanation_source,
        "judge_agreed": judge_agreed,
    }


def _select_queries(model, tracer, scenario_id: str, source) -> tuple[str, list[str]]:
    catalog_json = json.dumps(_CATALOG_LIST, ensure_ascii=False)
    messages = [
        {"role": "system", "content": ROLE_SYSTEMS["planner"]},
        {
            "role": "user",
            "content": (
                f"Scenario {scenario_id}. Query catalog: {catalog_json}. "
                'Reply with JSON {"queries": ["positions", ...]}.'
            ),
        },
    ]
    chosen: list[str] | None = None
    query_source = "planner"

    for attempt in range(MAX_PLANNER_ATTEMPTS):
        draft = _complete_and_log(
            model,
            tracer,
            "planner",
            scenario_id,
            messages,
            action="select_queries",
            input_summary=f"Scenario {scenario_id}. Catalog size {len(_CATALOG_LIST)}.",
            target_agent="host",
            retry_count=attempt,
        )
        names = _parse_query_names(draft)
        valid, reason = _validate_query_list(names)
        if valid:
            chosen = names
            query_source = "planner"
            break
        if attempt + 1 >= MAX_PLANNER_ATTEMPTS:
            chosen = list(_CATALOG_LIST)
            query_source = "host_fallback"
            break
        tracer.log(
            role="host",
            scenario_id=scenario_id,
            action="reject_queries",
            input_summary=reason,
            output_summary=draft,
            target_agent="planner",
            model="host",
            retry_count=attempt,
            status="retry",
        )
        messages = messages + [
            {"role": "assistant", "content": draft},
            {
                "role": "user",
                "content": (
                    f"Query catalog: {catalog_json}. Rejected: {reason}. "
                    'Reply with JSON {"queries": [...]} using only catalog names '
                    "and including positions, reports, cameras, road_events, demand."
                ),
            },
        ]

    assert chosen is not None
    return query_source, chosen


def _run_diagnostician(
    model,
    tracer,
    scenario_id: str,
    classify_bundle: dict,
    reports: list[dict],
) -> tuple[str, dict]:
    raw_summary = _raw_row_summary(classify_bundle)
    untrusted = _untrusted_reports_block(reports)
    messages = [
        {"role": "system", "content": ROLE_SYSTEMS["diagnostician"]},
        {
            "role": "user",
            "content": (
                f"Scenario {scenario_id}.\n\n{raw_summary}\n\n{untrusted}\n\n"
                'Propose JSON with status, incident_type, and evidence_ids.'
            ),
        },
    ]
    classification_source = "agreed"
    proposal: dict | None = None

    for attempt in range(MAX_DIAGNOSTICIAN_ATTEMPTS):
        draft = _complete_and_log(
            model,
            tracer,
            "diagnostician",
            scenario_id,
            messages,
            action="diagnostician",
            input_summary="Row summary and untrusted reports only.",
            target_agent="host",
            retry_count=attempt,
        )
        proposal = _parse_diagnostician_proposal(draft)
        host_class = classify(classify_bundle)
        if _classification_agrees(proposal, host_class):
            classification_source = "agreed"
            return classification_source, host_class
        if attempt + 1 >= MAX_DIAGNOSTICIAN_ATTEMPTS:
            classification_source = "host_check"
            return classification_source, host_class
        tracer.log(
            role="host",
            scenario_id=scenario_id,
            action="reject_classification",
            input_summary=(
                f"proposed={proposal.get('status')}/{proposal.get('incident_type')}"
            ),
            output_summary=draft,
            target_agent="diagnostician",
            model="host",
            retry_count=attempt,
            status="retry",
        )
        facts = _contradiction_facts(classify_bundle)
        messages = messages + [
            {"role": "assistant", "content": draft},
            {
                "role": "user",
                "content": (
                    "That proposal does not match the sensor rows. "
                    f"Contradicting facts:\n{facts}\n\n"
                    'Propose JSON with status, incident_type, and evidence_ids.'
                ),
            },
        ]

    host_class = classify(classify_bundle)
    return classification_source, host_class


def _run_judge(
    model, tracer, scenario_id: str, alternatives: list[dict], ranked: dict
) -> tuple[bool, str | None]:
    score_lines = []
    for alt in alternatives:
        score_lines.append(
            f"- {alt['action']}: {alt['passenger_minutes']} passenger-minutes"
        )
    messages = [
        {"role": "system", "content": ROLE_SYSTEMS["judge"]},
        {
            "role": "user",
            "content": (
                f"Scenario {scenario_id}. Host scores:\n"
                + "\n".join(score_lines)
                + '\n\nReply with JSON {"action": "<catalog action>"}.'
            ),
        },
    ]
    draft = _complete_and_log(
        model,
        tracer,
        "judge",
        scenario_id,
        messages,
        action="judge",
        input_summary="Four alternative passenger-minute scores.",
        target_agent="host",
    )
    parsed = _parse_judge_action(draft)
    winner = ranked["recommended_action"]
    agreed = parsed == winner
    if not agreed:
        tracer.log(
            role="host",
            scenario_id=scenario_id,
            action="reject_judge_action",
            input_summary=f"simulation winner {winner}",
            output_summary=draft,
            target_agent="judge",
            model="host",
            status="retry",
        )
    return agreed, parsed


def _run_reporter(
    model,
    tracer,
    scenario_id: str,
    ranked: dict,
    classification: dict,
    template_sentence: str,
    evidence_ids: list[str],
    reports: list[dict],
) -> tuple[str, str]:
    explanation_source = "host_fallback"
    stored = template_sentence
    prior = ""

    for attempt in range(MAX_REPORTER_RETURNS):
        messages = _reporter_messages(
            scenario_id,
            ranked,
            classification,
            template_sentence,
            evidence_ids,
            reports,
            prior,
        )
        draft = _complete_and_log(
            model,
            tracer,
            "reporter",
            scenario_id,
            messages,
            action="explain",
            input_summary="Spanish explanation with evidence and figures.",
            target_agent="host",
            retry_count=attempt,
            status="ok",
        )
        if _reporter_accepted(
            draft, evidence_ids, ranked, template_sentence
        ):
            explanation_source = "reporter"
            stored = draft
            return explanation_source, stored
        if attempt + 1 < MAX_REPORTER_RETURNS:
            tracer.log(
                role="host",
                scenario_id=scenario_id,
                action="request_evidence_citation",
                input_summary="Reporter draft failed host checks.",
                output_summary=draft,
                target_agent="reporter",
                model="host",
                retry_count=attempt,
                status="retry",
            )
            prior = draft

    return explanation_source, stored


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


def _untrusted_reports_block(reports: list[dict]) -> str:
    if not reports:
        return "Untrusted report data:\n(none)"
    lines = ["Untrusted report data:"]
    for row in reports:
        description = row.get("description", "")
        lines.append(f"- {row.get('report_id', '')}: {description}")
    return "\n".join(lines)


def _raw_row_summary(bundle: dict) -> str:
    positions = bundle.get("positions", [])
    cameras = bundle.get("cameras", [])
    road_events = bundle.get("road_events", [])
    reports = bundle.get("reports", [])
    demand = bundle.get("demand", [])

    slow_ids = _slow_vehicle_ids(positions)
    camera_states = [
        f"{row.get('camera_id', '')}={row.get('state', '')}" for row in cameras
    ]
    event_bits = [
        f"{row.get('event_id', '')}:{row.get('type', '')}/{row.get('severity', '')}"
        for row in road_events
    ]
    waiting = _waiting_total(demand)

    lines = [
        "Row summary (trusted sensor fields):",
        f"- slow_vehicle_ids (speed_kmh <= 5, latest per vehicle): {slow_ids}",
        f"- camera_states: {camera_states}",
        f"- road_events (type/severity): {event_bits}",
        f"- report_count: {len(reports)}",
        f"- waiting_passengers_total: {waiting}",
    ]
    return "\n".join(lines)


def _contradiction_facts(bundle: dict) -> str:
    positions = bundle.get("positions", [])
    cameras = bundle.get("cameras", [])
    road_events = bundle.get("road_events", [])
    reports = bundle.get("reports", [])

    slow_ids = _slow_vehicle_ids(positions)
    blocked = _camera_blocked(cameras)
    high_block = _has_high_road_block(road_events)
    return (
        f"report_count={len(reports)}; camera_blocked={blocked}; "
        f"high_road_block={high_block}; slow_vehicle_ids={slow_ids}"
    )


def _scenario_messages(
    scenario_id: str,
    catalog: list[str],
    alternatives: list[dict],
    ranked: dict,
) -> list[dict]:
    alt_json = json.dumps(
        [{"action": a["action"], "passenger_minutes": a["passenger_minutes"]} for a in alternatives],
        ensure_ascii=False,
    )
    return [
        {"role": "system", "content": ROLE_SYSTEMS["scenario"]},
        {
            "role": "user",
            "content": (
                f"Scenario {scenario_id}. Catalog: {json.dumps(catalog)}. "
                f"Host ranking (informational): {ranked['recommended_action']} "
                f"at {ranked['passenger_minutes']} passenger-minutes. "
                f"Alternatives: {alt_json}. "
                'Propose JSON using only catalog action names.'
            ),
        },
    ]


def _reporter_messages(
    scenario_id: str,
    ranked: dict,
    classification: dict,
    template_sentence: str,
    evidence_ids: list[str],
    reports: list[dict],
    prior_draft: str,
) -> list[dict]:
    parts = [
        f"Scenario {scenario_id}.",
        _untrusted_reports_block(reports),
        f"Evidence ids: {json.dumps(evidence_ids, ensure_ascii=False)}",
        f"Passenger-minutes (20 min): {ranked.get('passenger_minutes', 0)}",
        f"Reduction vs baseline (%): {ranked.get('reduction_percent', 0)}",
        f"Recommended action: {ranked.get('recommended_action', '')}",
        f"Host template sentence (fallback): {template_sentence}",
        "Write one Spanish sentence for the operator.",
    ]
    if prior_draft:
        parts.append(
            "Your previous draft failed host checks. Cite an evidence id and "
            "include the passenger-minute figures above."
        )
        parts.append(f"Previous draft:\n{prior_draft}")
    return [
        {"role": "system", "content": ROLE_SYSTEMS["reporter"]},
        {"role": "user", "content": "\n\n".join(parts)},
    ]


def _parse_query_names(raw: str) -> list[str]:
    data = _load_json_object(raw)
    queries = data.get("queries", [])
    names: list[str] = []
    for item in queries:
        if isinstance(item, str):
            names.append(item)
        elif isinstance(item, dict) and "name" in item:
            names.append(str(item["name"]))
    return names


def _validate_query_list(names: list[str]) -> tuple[bool, str]:
    if not names:
        return False, "empty query list"
    unknown = [name for name in names if name not in QUERY_NAMES]
    missing = sorted(CORE_QUERIES - set(names))
    reasons = []
    if unknown:
        reasons.append(f"unknown names: {', '.join(unknown)}")
    if missing:
        reasons.append(f"missing core: {', '.join(missing)}")
    if reasons:
        return False, "; ".join(reasons)
    return True, ""


def _parse_diagnostician_proposal(raw: str) -> dict:
    data = _load_json_object(raw)
    return {
        "status": data.get("status"),
        "incident_type": data.get("incident_type"),
        "evidence_ids": data.get("evidence_ids") or [],
    }


def _classification_agrees(proposal: dict, host_class: dict) -> bool:
    return (
        proposal.get("status") == host_class.get("status")
        and proposal.get("incident_type") == host_class.get("incident_type")
    )


def _parse_judge_action(raw: str) -> str | None:
    data = _load_json_object(raw)
    action = data.get("action") or data.get("recommended_action")
    if action is None:
        return None
    return str(action)


def _load_json_object(raw: str) -> dict:
    text = raw.strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass
    return {}


def _reporter_accepted(
    draft: str,
    evidence_ids: list[str],
    ranked: dict,
    template_sentence: str,
) -> bool:
    if not evidence_ids:
        if draft.strip() != template_sentence.strip():
            return False
        return "divert" not in draft.lower()

    pm = str(ranked.get("passenger_minutes", 0))
    rp = str(ranked.get("reduction_percent", 0))
    has_id = any(item in draft for item in evidence_ids)
    has_pm = pm in draft
    has_rp = rp in draft
    return has_id and has_pm and has_rp


def system_messages_must_exclude_injection(systems: list[str]) -> bool:
    return all(FALSE_REPORT_SENTENCE not in text for text in systems)
