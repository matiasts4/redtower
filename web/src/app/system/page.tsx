import { Suspense } from "react";
import { Gallery } from "@/components/gallery";
import { loadTables } from "@/lib/load-sources";
import { loadScenarios } from "@/lib/scenarios";

export default function SystemPage() {
  return (
    <Suspense>
      <Gallery scenarios={loadScenarios()} tables={loadTables()} />
    </Suspense>
  );
}
