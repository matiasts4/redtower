import { Suspense } from "react";
import { Gallery } from "@/components/gallery";
import { loadScenarios } from "@/lib/scenarios";

export default function SystemPage() {
  const scenarios = loadScenarios();
  return (
    <Suspense>
      <Gallery scenarios={scenarios} />
    </Suspense>
  );
}
