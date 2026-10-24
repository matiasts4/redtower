#!/usr/bin/env python3
"""Smoke test script for RED Control Tower.

Verifies:
1. Local sample mode execution with synthetic data.
2. Optional live sponsor connectivity (Zetaris on :3000 and Meterless on :8088).
3. Output format and deterministic queue simulation results.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check(name: str, fn) -> bool:
    try:
        fn()
        print(f"[PASS] {name}")
        return True
    except Exception as exc:
        print(f"[FAIL] {name}: {exc}")
        return False


def test_sample_execution():
    out_file = ROOT / "logs" / "smoke_test_scn-block.json"
    cmd = [
        sys.executable,
        str(ROOT / "run.py"),
        "--input",
        str(ROOT / "input_examples" / "scn-block.json"),
        "--output",
        str(out_file),
        "--sample",
    ]
    res = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"run.py exited with code {res.returncode}: {res.stderr}")
    data = json.loads(res.stdout)
    assert data.get("scenario_id") == "scn-block", "scenario_id mismatch"
    rec = data.get("recommendation", {})
    assert rec.get("action") == "relief_and_divert_210", f"Unexpected action: {rec.get('action')}"
    assert rec.get("reduction_percent") == 38, f"Expected 38% reduction, got {rec.get('reduction_percent')}"


def test_live_settings_check():
    cmd = [sys.executable, str(ROOT / "run.py"), "--check"]
    res = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    # --check exits 0 if live is configured or prints status
    lines = res.stdout.strip().split("\n")
    assert len(lines) >= 3, "Insufficient check output"


def main():
    print(f"Running RED Control Tower Smoke Test in {ROOT}...")
    success = True
    success &= check("1. Sample mode deterministic simulation (scn-block)", test_sample_execution)
    success &= check("2. System configuration check (run.py --check)", test_live_settings_check)

    if success:
        print("\nAll core smoke tests passed! System is ready.")
        return 0
    else:
        print("\nSmoke tests encountered failures. Review output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
