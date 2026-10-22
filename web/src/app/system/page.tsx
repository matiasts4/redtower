import { Suspense } from "react";
import { Console } from "@/components/console";
import { loadTables } from "@/lib/load-sources";
import { loadScenarios } from "@/lib/scenarios";

export default function SystemPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-field/40" />}>
      <Console scenarios={loadScenarios()} tables={loadTables()} />
    </Suspense>
  );
}
