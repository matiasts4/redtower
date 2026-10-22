import os

from openai import OpenAI


class MissingCredentials(Exception):
    pass


class UnexpectedModel(Exception):
    pass


def _is_missing(value: str | None) -> bool:
    if value is None:
        return True
    stripped = value.strip()
    if not stripped:
        return True
    if "tu_api_key" in stripped.lower():
        return True
    return False


class MeterlessModel:
    """Nightshift client for planner, diagnostician, scenario, judge, and reporter."""

    name = "meterless"

    def __init__(self) -> None:
        base = os.environ.get("METERLESS_BASE_URL", "")
        key = os.environ.get("METERLESS_API_KEY", "")
        super_model = os.environ.get("NEMOTRON_SUPER", "")
        nano = os.environ.get("NEMOTRON_NANO", "") or super_model
        ultra = os.environ.get("NEMOTRON_ULTRA", "") or super_model
        if _is_missing(base) or _is_missing(key) or _is_missing(super_model):
            raise MissingCredentials(
                "Meterless credentials or NEMOTRON_SUPER are missing."
            )
        self.client = OpenAI(base_url=base.rstrip("/"), api_key=key, timeout=180.0)
        self.models = {
            "planner": super_model,
            "diagnostician": super_model,
            "scenario": super_model,
            "judge": ultra,
            "reporter": nano,
        }
        self.model_id = super_model
        self.systems: list[str] = []

    def complete(self, role: str, messages: list[dict]) -> str:
        for message in messages:
            if message.get("role") == "system":
                self.systems.append(message.get("content", ""))
        model_id = self.models.get(role, self.models["planner"])
        response = self.client.chat.completions.create(
            model=model_id,
            messages=messages,
        )
        reported = str(getattr(response, "model", "") or "").strip()
        allowed = {value for value in self.models.values() if value}
        if not _is_configured_nemotron(reported, allowed):
            raise UnexpectedModel(
                f"Nightshift reported model {reported!r}, which is not a configured Nemotron id."
            )
        self.model_id = reported
        choice = response.choices[0].message.content or ""
        return choice.strip()


def _is_configured_nemotron(reported: str, allowed: set[str]) -> bool:
    """Accept the configured id, or the Nemotron id a Meterless alias resolves to."""
    if not reported or not allowed:
        return False
    if reported in allowed:
        return True
    return "nemotron" in reported.lower()
