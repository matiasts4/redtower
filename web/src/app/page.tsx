import { Landing } from "@/components/landing";
import { loadRoutes } from "@/lib/load-sources";
import { loadScenarios } from "@/lib/scenarios";

export default function Home() {
  return <Landing scenarios={loadScenarios()} routes={loadRoutes()} />;
}
