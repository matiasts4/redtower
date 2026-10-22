import { Landing } from "@/components/landing";
import { loadScenarios } from "@/lib/scenarios";

export default function Home() {
  return <Landing scenarios={loadScenarios()} />;
}
