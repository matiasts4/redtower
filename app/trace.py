import json
from datetime import datetime, timezone
from pathlib import Path


def _truncate(text: str, limit: int = 500) -> str:
    text = "" if text is None else str(text)
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


class Tracer:
    def __init__(self, path: Path, echo: bool = False, on_event=None):
        self.path = path
        self.echo = echo
        self.on_event = on_event
        self.last_timestamp = None
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def log(
        self,
        *,
        role: str,
        scenario_id: str,
        action: str = "",
        input_summary: str = "",
        output_summary: str = "",
        target_agent: str = "",
        model: str = "",
        retry_count: int = 0,
        status: str = "ok",
        duration_ms: int | None = None,
    ) -> None:
        now = datetime.now(timezone.utc)
        if duration_ms is None and self.last_timestamp is not None:
            duration_ms = int((now - self.last_timestamp).total_seconds() * 1000)
        self.last_timestamp = now
        record = {
            "timestamp": now.isoformat(),
            "agent_name": role,
            "role": role,
            "action": action or role,
            "input_summary": _truncate(input_summary),
            "output_summary": _truncate(output_summary),
            "target_agent": target_agent,
            "model": model,
            "scenario_id": scenario_id,
            "retry_count": retry_count,
            "status": status,
            "duration_ms": duration_ms if duration_ms is not None else 0,
        }
        line = json.dumps(record, ensure_ascii=False)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
        if self.echo:
            print(line, flush=True)
        if self.on_event:
            try:
                self.on_event(record)
            except Exception:
                pass
