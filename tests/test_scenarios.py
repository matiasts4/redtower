import unittest

from app.scenarios import (
    RELIEF_BOARD_PER_MIN,
    action_rates,
    build_alternatives,
    catalog_for,
    queue_passenger_minutes,
)


class QueuePassengerMinutesTests(unittest.TestCase):
    def test_horizon_20_locked_triples(self):
        self.assertEqual(queue_passenger_minutes(120, 84, 84, 20), 2400)
        self.assertEqual(queue_passenger_minutes(120, 72, 84, 20), 1560)
        self.assertEqual(queue_passenger_minutes(120, 84, 120, 20), 1716)
        self.assertEqual(queue_passenger_minutes(120, 72, 120, 20), 1488)

    def test_horizon_10_locked_triples(self):
        self.assertEqual(queue_passenger_minutes(120, 84, 84, 10), 1200)
        self.assertEqual(queue_passenger_minutes(120, 72, 84, 10), 840)
        self.assertEqual(queue_passenger_minutes(120, 84, 120, 10), 876)
        self.assertEqual(queue_passenger_minutes(120, 72, 120, 10), 768)

    def test_horizon_30_locked_triples(self):
        self.assertEqual(queue_passenger_minutes(120, 84, 84, 30), 3600)
        self.assertEqual(queue_passenger_minutes(120, 72, 84, 30), 2280)
        self.assertEqual(queue_passenger_minutes(120, 84, 120, 30), 2556)
        self.assertEqual(queue_passenger_minutes(120, 72, 120, 30), 2208)

    def test_relief_constant(self):
        self.assertEqual(RELIEF_BOARD_PER_MIN, 36)


class ActionCatalogTests(unittest.TestCase):
    def test_clear_and_insufficient_only_hold(self):
        self.assertEqual(catalog_for("clear"), ["hold"])
        self.assertEqual(catalog_for("none"), ["hold"])
        self.assertEqual(catalog_for("unconfirmed"), ["hold"])

    def test_road_block_actions(self):
        self.assertEqual(
            catalog_for("road_block"),
            ["wait", "divert_210", "dispatch_relief", "relief_and_divert_210"],
        )

    def test_stopped_and_surge_actions(self):
        self.assertEqual(catalog_for("stopped_bus"), ["wait", "dispatch_relief"])
        self.assertEqual(catalog_for("demand_surge"), ["wait", "dispatch_relief"])

    def test_action_rates_divert_and_relief(self):
        measured = {
            "arrival_per_min": 84,
            "board_per_min": 84,
            "route_210_arrival_per_min": 12,
        }
        self.assertEqual(
            action_rates("wait", measured),
            {"arrival_per_min": 84, "board_per_min": 84},
        )
        self.assertEqual(
            action_rates("divert_210", measured),
            {"arrival_per_min": 72, "board_per_min": 84},
        )
        self.assertEqual(
            action_rates("dispatch_relief", measured),
            {"arrival_per_min": 84, "board_per_min": 120},
        )
        self.assertEqual(
            action_rates("relief_and_divert_210", measured),
            {"arrival_per_min": 72, "board_per_min": 120},
        )


if __name__ == "__main__":
    unittest.main()
