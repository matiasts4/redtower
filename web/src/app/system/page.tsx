import { Gallery } from "@/components/gallery";
import { loadScenarios } from "@/lib/scenarios";

export default function SystemPage() {
  return <Gallery scenarios={loadScenarios()} />;
}
