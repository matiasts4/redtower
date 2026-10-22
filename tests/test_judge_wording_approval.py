import unittest

from app.approval import authorize
from app.confirm import classify
from app.impact import measure
from app.judge import rank
from app.scenarios import build_alternatives
from app.store import SampleSource
from app.wording import diagnosis_text, recommendation_text


def load_bundle(source: SampleSource, scenario_id: str) -> dict:
    names = (
        "scenario_window",
        "routes",
        "stops",
        "stop_sequence",
        "positions",
        "demand",
        "reports",
        "road_events",
        "cameras",
        "weather",
        "vehicles",
    )
    return {name: source.run(name, scenario_id) for name in names}


class RankTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SampleSource()

    def _rank_scenario(self, scenario_id: str) -> dict:
        bundle = load_bundle(self.source, scenario_id)
        classification = classify(bundle)
        impact = measure(bundle, classification)
        alternatives = build_alternatives(impact, classification["incident_type"])
        return rank(alternatives)

    def test_block_winner_relief_and_divert(self):
        ranked = self._rank_scenario("scn-block")
        self.assertEqual(ranked["recommended_action"], "relief_and_divert_210")
        self.assertEqual(ranked["passenger_minutes"], 1488)
        self.assertEqual(ranked["baseline_passenger_minutes"], 2400)
        self.assertEqual(ranked["saved"], 912)
        self.assertEqual(ranked["reduction_percent"], 38)

    def test_stopped_winner_dispatch_relief(self):
        ranked = self._rank_scenario("scn-stopped")
        self.assertEqual(ranked["recommended_action"], "dispatch_relief")
        self.assertEqual(ranked["passenger_minutes"], 234)
        self.assertEqual(ranked["baseline_passenger_minutes"], 2700)

    def test_surge_winner_dispatch_relief(self):
        ranked = self._rank_scenario("scn-surge")
        self.assertEqual(ranked["recommended_action"], "dispatch_relief")
        self.assertEqual(ranked["passenger_minutes"], 1170)
        self.assertEqual(ranked["baseline_passenger_minutes"], 5140)

    def test_normal_winner_hold(self):
        ranked = self._rank_scenario("scn-normal")
        self.assertEqual(ranked["recommended_action"], "hold")

    def test_false_winner_hold(self):
        ranked = self._rank_scenario("scn-false")
        self.assertEqual(ranked["recommended_action"], "hold")


class WordingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SampleSource()

    def test_block_diagnosis_exact(self):
        bundle = load_bundle(self.source, "scn-block")
        classification = classify(bundle)
        impact = measure(bundle, classification)
        text = diagnosis_text(classification, impact)
        self.assertEqual(
            text,
            "El incidente probablemente es real. Afecta a cuatro recorridos, "
            "nueve paraderos y aproximadamente 1.800 pasajeros durante los "
            "próximos 20 minutos.",
        )

    def test_three_routes_must_not_say_cuatro(self):
        impact = {
            "routes": ["210", "307", "406"],
            "stops": ["STOP_06"] * 9,
            "passengers_by_horizon": {20: 1800},
        }
        classification = {"status": "real", "incident_type": "road_block"}
        text = diagnosis_text(classification, impact)
        self.assertNotIn("cuatro", text)

    def test_block_recommendation_exact(self):
        ranked = {
            "recommended_action": "relief_and_divert_210",
            "reduction_percent": 38,
        }
        text = recommendation_text(ranked, {"incident_type": "road_block"})
        self.assertEqual(
            text,
            "Enviar un bus de refuerzo y desviar temporalmente el recorrido 210. "
            "Esta opción reduce el impacto estimado en 38% frente a esperar.",
        )

    def test_insufficient_exact(self):
        text = recommendation_text(
            {"recommended_action": "hold"},
            {"incident_type": "unconfirmed", "status": "insufficient"},
        )
        self.assertEqual(
            text,
            "Evidencia insuficiente. No recomiendo modificar la operación.",
        )

    def test_clear_exact(self):
        text = recommendation_text(
            {"recommended_action": "hold"},
            {"incident_type": "none", "status": "clear"},
        )
        self.assertEqual(
            text,
            "La operación del corredor está dentro de lo esperado. "
            "No recomiendo modificar el servicio.",
        )


class ApprovalTests(unittest.TestCase):
    def test_not_approved_pending(self):
        result = authorize({"recommended_action": "hold"}, approved=False)
        self.assertFalse(result["applied"])
        self.assertEqual(result["authorization"], "pending_human")
        self.assertIsNone(result["operator_decision"])
        self.assertNotIn("executed", result)

    def test_approved_recorded(self):
        result = authorize({"recommended_action": "hold"}, approved=True)
        self.assertFalse(result["applied"])
        self.assertEqual(result["authorization"], "recorded")
        self.assertEqual(result["operator_decision"], "approve")


if __name__ == "__main__":
    unittest.main()
