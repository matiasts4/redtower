export function pendingRole(steps: Array<{ targetAgent?: string }>): string {
  if (steps.length === 0) return "planner";
  const next = steps[steps.length - 1]?.targetAgent?.trim();
  return next || "host";
}

export function previewText(text: string, max = 180): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trim()}…`;
}
