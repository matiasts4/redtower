import tempfile
import unittest
from pathlib import Path

from app.fixture import FALSE_REPORT_SENTENCE, FixtureModel
from app.loop import run_scenario
from app.store import SampleSource
from app.switch import ROLE_SYSTEMS
from app.trace import Tracer


class SwitchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SampleSource()

    def _run_false(self):
        model = FixtureModel()
        trace_file = Path(tempfile.gettempdir()) / "redtower-switch-trace.jsonl"
        tracer = Tracer(trace_file, echo=False)
        result = run_scenario("scn-false", self.source, model, tracer)
        return result, model

    def test_role_order_and_system_prompts(self):
        _, model = self._run_false()
        expected = ["planner", "diagnostician", "scenario", "judge", "reporter"]
        seen = []
        for role in model.roles_called:
            if role not in seen:
                seen.append(role)
        self.assertEqual(seen[:5], expected)

        self.assertEqual(len(model.systems), len(model.roles_called))
        for role, system in zip(model.roles_called, model.systems):
            self.assertTrue(
                system.startswith(ROLE_SYSTEMS[role]),
                msg=f"{role} system must start with the S5 sentence",
            )
        for role in ROLE_SYSTEMS:
            self.assertTrue(
                any(text.startswith(ROLE_SYSTEMS[role]) for text in model.systems),
                msg=f"Missing system prompt for {role}",
            )

        for text in model.systems:
            self.assertNotIn(FALSE_REPORT_SENTENCE, text)

        user_blob = "\n".join(model.users)
        self.assertIn(FALSE_REPORT_SENTENCE, user_blob)
        self.assertIn("Untrusted report data:", user_blob)

        for text in model.systems:
            self.assertNotIn("Untrusted report data:", text)


if __name__ == "__main__":
    unittest.main()
