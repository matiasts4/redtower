import os
import unittest

from app.store import SampleSource, bind_params, build_source, load_queries, sample_mode


class StoreTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SampleSource()

    def test_all_named_queries_exist(self):
        queries = load_queries()
        expected = (
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
        self.assertEqual(tuple(sorted(queries)), tuple(sorted(expected)))

    def test_scenario_window_block(self):
        rows = self.source.run("scenario_window", "scn-block")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["scenario_id"], "scn-block")

    def test_demand_block_stop_06(self):
        rows = self.source.run("demand", "scn-block")
        by_stop = {row["stop_id"]: row for row in rows}
        self.assertEqual(int(by_stop["STOP_06"]["waiting_passengers"]), 20)
        self.assertEqual(int(by_stop["STOP_06"]["arrival_per_min"]), 12)
        self.assertEqual(int(by_stop["STOP_06"]["route_210_arrival_per_min"]), 4)

    def test_positions_block_latest_slow_count(self):
        rows = self.source.run("positions", "scn-block")
        latest = {}
        for row in rows:
            vid = row["vehicle_id"]
            if vid not in latest or row["timestamp"] > latest[vid]["timestamp"]:
                latest[vid] = row
        slow = [vid for vid, row in latest.items() if float(row["speed_kmh"]) <= 5]
        self.assertEqual(len(slow), 3)

    def test_reports_block_three_accidents(self):
        rows = self.source.run("reports", "scn-block")
        self.assertEqual(len(rows), 3)

    def test_invalid_scenario_id_raises(self):
        with self.assertRaises(ValueError):
            self.source.run("demand", "scn-block; drop")

    def test_unknown_query_raises(self):
        with self.assertRaises(KeyError):
            self.source.run("not_a_query", "scn-block")

    def test_bind_rejects_bad_id(self):
        queries = load_queries()
        with self.assertRaises(ValueError):
            bind_params(queries["demand"], "scn-evil; drop")

    def test_build_source_sample_default(self):
        prior = os.environ.pop("SAMPLE_MODE", None)
        try:
            source = build_source()
            self.assertIsInstance(source, SampleSource)
        finally:
            if prior is not None:
                os.environ["SAMPLE_MODE"] = prior

    def test_build_source_false_returns_zetaris(self):
        from app.adapters.zetaris import ZetarisSource

        prior = os.environ.get("SAMPLE_MODE")
        os.environ["SAMPLE_MODE"] = "false"
        try:
            source = build_source()
            self.assertIsInstance(source, ZetarisSource)
        finally:
            if prior is None:
                os.environ.pop("SAMPLE_MODE", None)
            else:
                os.environ["SAMPLE_MODE"] = prior

    def test_sample_mode_default_true(self):
        prior = os.environ.pop("SAMPLE_MODE", None)
        try:
            self.assertTrue(sample_mode())
        finally:
            if prior is not None:
                os.environ["SAMPLE_MODE"] = prior


if __name__ == "__main__":
    unittest.main()
