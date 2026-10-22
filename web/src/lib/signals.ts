export type SignalKind = "report" | "vehicle" | "camera" | "road";

export type SignalGroups = Record<SignalKind, string[]>;

const PREFIX: Array<[SignalKind, string]> = [
  ["report", "REP_"],
  ["vehicle", "BUS_"],
  ["camera", "CAM_"],
  ["road", "RD_"],
];

export function groupEvidence(ids: string[]): SignalGroups {
  const grouped: SignalGroups = { report: [], vehicle: [], camera: [], road: [] };
  for (const id of ids) {
    const kind = PREFIX.find(([, prefix]) => id.startsWith(prefix))?.[0];
    if (kind) grouped[kind].push(id);
  }
  return grouped;
}
