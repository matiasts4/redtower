export type SourceRow = Record<string, string>;

export type SourceSpec = {
  query: string;
  file: string;
  columns: string[];
  usedToClassify: boolean;
};

export const SOURCES: SourceSpec[] = [
  {
    query: "scenario_window",
    file: "scenarios.csv",
    columns: ["scenario_id", "label", "corridor"],
    usedToClassify: true,
  },
  {
    query: "routes",
    file: "routes.csv",
    columns: ["route_id", "corridor"],
    usedToClassify: false,
  },
  {
    query: "stops",
    file: "stops.csv",
    columns: ["stop_id", "corridor", "corridor_order", "latitude", "longitude"],
    usedToClassify: true,
  },
  {
    query: "stop_sequence",
    file: "stop_sequence.csv",
    columns: ["route_id", "stop_id", "sequence_order"],
    usedToClassify: true,
  },
  {
    query: "positions",
    file: "vehicle_positions.csv",
    columns: ["scenario_id", "vehicle_id", "timestamp", "route_id", "nearest_stop", "speed_kmh", "latitude", "longitude"],
    usedToClassify: true,
  },
  {
    query: "demand",
    file: "passenger_demand.csv",
    columns: ["scenario_id", "stop_id", "waiting_passengers", "arrival_per_min", "route_210_arrival_per_min"],
    usedToClassify: true,
  },
  {
    query: "reports",
    file: "user_reports.csv",
    columns: ["scenario_id", "report_id", "segment_id", "description", "reported_at"],
    usedToClassify: true,
  },
  {
    query: "road_events",
    file: "road_events.csv",
    columns: ["scenario_id", "event_id", "segment_id", "type", "severity"],
    usedToClassify: true,
  },
  {
    query: "cameras",
    file: "cameras.csv",
    columns: ["scenario_id", "camera_id", "segment_id", "state"],
    usedToClassify: true,
  },
  {
    query: "weather",
    file: "weather.csv",
    columns: ["scenario_id", "condition", "observed_at"],
    usedToClassify: false,
  },
  {
    query: "vehicles",
    file: "vehicles.csv",
    columns: ["vehicle_id", "route_id", "label"],
    usedToClassify: false,
  },
];

export function rowsFor(
  tables: Record<string, SourceRow[]>,
  query: string,
  scenarioId: string,
): SourceRow[] {
  const spec = SOURCES.find((source) => source.query === query);
  if (!spec) return [];
  const rows = tables[spec.file] ?? [];
  if (!spec.columns.includes("scenario_id")) return rows;
  return rows.filter((row) => row.scenario_id === scenarioId);
}
