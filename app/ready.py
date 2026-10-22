import os

from app.adapters.meterless import _is_missing
from app.store import load_queries

LIVE_KEYS = (
    "METERLESS_BASE_URL",
    "METERLESS_API_KEY",
    "NEMOTRON_SUPER",
    "ZETARIS_API_URL",
)


def readiness_lines(environ: dict | None = None) -> tuple[int, list[str]]:
    environ = os.environ if environ is None else environ
    lines: list[str] = []
    sample = environ.get("SAMPLE_MODE", "true").strip().lower() in {"1", "true", "yes"}
    lines.append(f"sample_mode: {'on' if sample else 'off'}")

    try:
        load_queries()
    except Exception:
        lines.append("queries: failed")
        return 2, lines
    lines.append("queries: ready")

    missing = False
    for key in LIVE_KEYS:
        if _is_missing(environ.get(key)):
            lines.append(f"{key}: missing")
            missing = True
        else:
            lines.append(f"{key}: configured")

    if missing:
        return 2, lines
    return 0, lines
