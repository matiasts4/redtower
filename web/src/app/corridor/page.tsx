import { CorridorPage } from "@/components/corridor-page";
import { loadRoutes } from "@/lib/load-sources";

export default function Page() {
  return <CorridorPage routes={loadRoutes()} />;
}
