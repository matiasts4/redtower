import { Suspense } from "react";
import { Console } from "@/components/console";
import { loadTables } from "@/lib/load-sources";
import { loadScenarios } from "@/lib/scenarios";
import { loadAllTraces } from "@/lib/load-trace";

export default function SystemPage() {
  const scenarios = loadScenarios();
  const tables = loadTables();
  const traces = loadAllTraces(scenarios, tables);

  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-field/40" />}>
      <Console scenarios={scenarios} tables={tables} traces={traces} />
    </Suspense>
  );
}
