export const RUN_STEPS = [
  { id: "planner", actor: "planner", action: "select_queries", decides: false },
  { id: "load", actor: "host", action: "load_sources", decides: true },
  { id: "diagnostician", actor: "diagnostician", action: "diagnostician", decides: false },
  { id: "rank", actor: "host", action: "rank_alternatives", decides: true },
  { id: "scenario", actor: "scenario", action: "scenario", decides: false },
  { id: "judge", actor: "judge", action: "judge", decides: false },
  { id: "reporter", actor: "reporter", action: "explain", decides: false },
] as const;

export type RunStepId = (typeof RUN_STEPS)[number]["id"];
