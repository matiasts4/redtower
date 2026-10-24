import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent


def main() -> int:
    load_dotenv(ROOT / ".env")
    parser = argparse.ArgumentParser(description="Run RED Control Tower on one scenario.")
    parser.add_argument("--input", help="JSON file with scenario_id")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report which live settings are configured. Does not print secret values.",
    )
    parser.add_argument(
        "--output",
        help="Output JSON path (default: output_examples/<stem>.json)",
    )
    parser.add_argument(
        "--fixture",
        action="store_true",
        help="Use FixtureModel instead of Meterless",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Use SampleSource (local CSV) instead of Zetaris",
    )
    parser.add_argument(
        "--approve",
        action="store_true",
        help="Record operator approval without applying route changes",
    )
    parser.add_argument(
        "--stream",
        action="store_true",
        help="Stream trace events as JSON lines to stdout as they occur",
    )
    args = parser.parse_args()

    if args.sample or args.fixture:
        os.environ["SAMPLE_MODE"] = "true"

    if args.check:
        from app.ready import readiness_lines

        code, lines = readiness_lines()
        for line in lines:
            print(line)
        return code

    if not args.input:
        print("Missing --input.", file=sys.stderr)
        return 1

    input_path = Path(args.input)
    if not input_path.is_absolute():
        input_path = ROOT / input_path
    if not input_path.is_file():
        print("Input file not found.", file=sys.stderr)
        return 1
    try:
        payload = json.loads(input_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print("Invalid JSON input.", file=sys.stderr)
        return 1
    scenario_id = payload.get("scenario_id")
    if not isinstance(scenario_id, str):
        print("Missing or invalid scenario_id.", file=sys.stderr)
        return 1

    output_path = (
        Path(args.output)
        if args.output
        else ROOT / "output_examples" / f"{input_path.stem}.json"
    )
    if not output_path.is_absolute():
        output_path = ROOT / output_path

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    trace_path = ROOT / "logs" / f"trace_{stamp}.jsonl"

    from app.fixture import FixtureModel
    from app.loop import run_scenario
    from app.store import build_source, sample_mode
    from app.trace import Tracer

    model = None
    if args.fixture or sample_mode():
        model = FixtureModel()
    else:
        from app.adapters.meterless import MeterlessModel, MissingCredentials

        try:
            model = MeterlessModel()
        except MissingCredentials as exc:
            print(str(exc), file=sys.stderr)
            return 2

    source = build_source(ROOT)
    tracer = Tracer(trace_path, echo=args.stream)
    try:
        result = run_scenario(
            scenario_id, source, model, tracer, approved=args.approve
        )
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Exception as exc:
        from app.adapters.meterless import UnexpectedModel
        from app.adapters.zetaris import ZetarisConnectionError
        from openai import APIConnectionError, APITimeoutError

        if isinstance(exc, UnexpectedModel):
            print(str(exc), file=sys.stderr)
            return 2
        if isinstance(exc, ZetarisConnectionError):
            print(f"Zetaris error: {exc}", file=sys.stderr)
            return 2
        if isinstance(exc, (APIConnectionError, APITimeoutError)):
            print(
                f"Meterless connection failed: {exc}. "
                "Ensure Nightshift is running or pass --sample / --fixture.",
                file=sys.stderr,
            )
            return 2
        raise

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    from app.report import render_markdown

    md_path = output_path.with_suffix(".md")
    md_path.write_text(render_markdown(result), encoding="utf-8")

    if args.stream:
        print(json.dumps({"event": "final_result", "data": result}, ensure_ascii=False), flush=True)
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
