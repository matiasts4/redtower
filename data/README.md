# Sample data

These rows are synthetic. They describe the fictional **Corredor Poniente** corridor only. They are not a feed from a transit agency. Live mode points Zetaris at these same files. This folder does not include the Zetaris platform.

Files in `sample/`:

- `scenarios.csv` — scenario identifiers and labels
- `routes.csv` — bus routes on the corridor
- `stops.csv` — stop ids and corridor order
- `stop_sequence.csv` — stop order per route
- `vehicles.csv` — fleet vehicles
- `vehicle_positions.csv` — per-scenario GPS snapshots (time-varying)
- `passenger_demand.csv` — per-scenario demand (time-varying)
- `user_reports.csv` — passenger reports (time-varying)
- `road_events.csv` — road closures and incidents (time-varying)
- `cameras.csv` — corridor camera state (time-varying)
- `weather.csv` — weather snapshot (time-varying)

Static geography is shared across scenarios. Time-varying tables include `scenario_id`.
