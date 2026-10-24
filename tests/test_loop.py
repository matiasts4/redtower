import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from app.fixture import (
    DiagnosticianRejectThenAgreeFixture,
    FixtureModel,
    JudgeWaitFixture,
    PlannerHostFallbackFixture,
    PlannerRejectThenValidFixture,
)
from app.loop import run_scenario
from app.store import SampleSource
from app.trace import Tracer

ROOT = Path(__file__).resolve().parents[1]


class LoopTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SampleSource()

    def _run(self, scenario_id: str, approved: bool = False, model=None):
        model = model or FixtureModel()
        trace_file = Path(tempfile.gettempdir()) / f"redtower-loop-{scenario_id}.jsonl"
        tracer = Tracer(trace_file, echo=False)
        result = run_scenario(
            scenario_id, self.source, model, tracer, approved=approved
        )
        return result, model, trace_file

    def test_scn_block_recommendation(self):
        result, model, _ = self._run("scn-block")
        rec = result["recommendation"]
        self.assertEqual(rec["action"], "relief_and_divert_210")
        self.assertEqual(rec["passenger_minutes"], 1488)
        self.assertEqual(rec["reduction_percent"], 38)
        self.assertEqual(
            result["diagnosis"],
            "El incidente probablemente es real. Afecta a cuatro recorridos, "
            "nueve paraderos y aproximadamente 1.800 pasajeros durante los "
            "próximos 20 minutos.",
        )
        self.assertIn("REP_BLK_1", rec["text"])
        self.assertIn("1488", rec["text"])
        self.assertIn("38", rec["text"])
        self.assertEqual(result["explanation_source"], "reporter")
        self.assertEqual(result["query_source"], "planner")
        self.assertEqual(result["classification_source"], "agreed")
        self.assertTrue(result["judge_agreed"])
        self.assertFalse(result["applied"])
        self.assertEqual(result["authorization"], "pending_human")
        self.assertEqual(result["model"], "fixture")
        self.assertNotEqual(rec["action"], "wait")
        self.assertEqual(model.reporter_calls, 2)
        trace_file = Path(tempfile.gettempdir()) / "redtower-loop-scn-block.jsonl"
        rows = [
            json.loads(line)
            for line in trace_file.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        self.assertTrue(
            any(
                row.get("action") == "load_sources"
                and "SampleSource" in row.get("output_summary", "")
                for row in rows
            )
        )
        self.assertTrue(
            any(row.get("agent_name") == "judge" and row.get("model") == "fixture" for row in rows)
        )

    def test_scn_false_insufficient(self):
        result, _model, _ = self._run("scn-false")
        self.assertIn(
            "Evidencia insuficiente. No recomiendo modificar la operación.",
            result["recommendation"]["text"],
        )
        self.assertEqual(result["recommendation"]["action"], "hold")
        self.assertNotIn("divert", result["recommendation"]["text"].lower())

    def test_scn_block_approve(self):
        result, _, _ = self._run("scn-block", approved=True)
        self.assertEqual(result["authorization"], "recorded")
        self.assertEqual(result["operator_decision"], "approve")
        self.assertFalse(result["applied"])

    def test_unknown_scenario(self):
        model = FixtureModel()
        trace_file = Path(tempfile.gettempdir()) / "redtower-unknown.jsonl"
        tracer = Tracer(trace_file, echo=False)
        with self.assertRaises(ValueError):
            run_scenario("scn-missing", self.source, model, tracer)

    def test_cli_unknown_scenario_no_output(self):
        bad_input = ROOT / "input_examples" / "_tmp_unknown.json"
        bad_input.write_text(json.dumps({"scenario_id": "scn-missing"}), encoding="utf-8")
        out_file = ROOT / "output_examples" / "_tmp_unknown.json"
        if out_file.exists():
            out_file.unlink()
        try:
            proc = subprocess.run(
                [sys.executable, str(ROOT / "run.py"), "--input", str(bad_input), "--fixture"],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(proc.returncode, 0)
            self.assertFalse(out_file.exists())
        finally:
            bad_input.unlink(missing_ok=True)
            out_file.unlink(missing_ok=True)

    def test_sample_mode_runs_without_meterless(self):
        out_file = Path(tempfile.gettempdir()) / "redtower-sample-mode.json"
        md_file = out_file.with_suffix(".md")
        env = os.environ.copy()
        env["SAMPLE_MODE"] = "true"
        try:
            proc = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "run.py"),
                    "--input",
                    str(ROOT / "input_examples" / "scn-false.json"),
                    "--output",
                    str(out_file),
                ],
                cwd=ROOT,
                env=env,
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
            payload = json.loads(out_file.read_text(encoding="utf-8"))
            self.assertEqual(payload["model"], "fixture")
            self.assertEqual(payload["recommendation"]["action"], "hold")
            self.assertFalse(payload["applied"])
        finally:
            out_file.unlink(missing_ok=True)
            md_file.unlink(missing_ok=True)

    def test_planner_reject_then_valid(self):
        result, _model, trace_file = self._run(
            "scn-block", model=PlannerRejectThenValidFixture()
        )
        self.assertEqual(result["query_source"], "planner")
        rows = [
            json.loads(line)
            for line in trace_file.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        self.assertTrue(any(row.get("action") == "reject_queries" for row in rows))

    def test_planner_host_fallback(self):
        result, _model, _ = self._run(
            "scn-block", model=PlannerHostFallbackFixture()
        )
        self.assertEqual(result["query_source"], "host_fallback")
        self.assertEqual(result["recommendation"]["action"], "relief_and_divert_210")

    def test_diagnostician_reject_then_agree(self):
        result, _model, trace_file = self._run(
            "scn-false", model=DiagnosticianRejectThenAgreeFixture()
        )
        self.assertEqual(result["classification_source"], "agreed")
        self.assertEqual(result["incident"]["incident_type"], "unconfirmed")
        self.assertNotIn("divert", result["recommendation"]["text"].lower())
        rows = [
            json.loads(line)
            for line in trace_file.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        self.assertTrue(
            any(row.get("action") == "reject_classification" for row in rows)
        )

    def test_judge_disagreement_keeps_simulation_winner(self):
        result, _model, _ = self._run("scn-block", model=JudgeWaitFixture())
        self.assertFalse(result["judge_agreed"])
        self.assertEqual(result["recommendation"]["action"], "relief_and_divert_210")


if __name__ == "__main__":
    unittest.main()
