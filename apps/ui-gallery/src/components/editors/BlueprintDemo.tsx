import { BlueprintViewer } from "@forgeron/blueprint-canvas";
import { library } from "virtual:blueprint-library";

// The viewer on the site's Blueprint library (read at build time as data, see astro.config.ts),
// opened on the ERP village.

export default function BlueprintDemo() {
  return <BlueprintViewer library={library} initial="erp-village.bp" />;
}
