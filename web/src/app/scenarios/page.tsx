import { ScenariosPage } from "@/components/scenarios-page";
import { loadScenarios } from "@/lib/scenarios";

export default function Page() {
  return <ScenariosPage scenarios={loadScenarios()} />;
}
