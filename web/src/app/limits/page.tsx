import { LimitsPage } from "@/components/limits-page";
import { loadScenarios } from "@/lib/scenarios";

export default function Page() {
  return <LimitsPage scenarios={loadScenarios()} />;
}
