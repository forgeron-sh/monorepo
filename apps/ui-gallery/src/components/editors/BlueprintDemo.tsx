import { BlueprintViewer } from "@forgeron/blueprint/canvas";
import { library } from "@forgeron/libraries/blueprints";

// The viewer on the Blueprint library (@forgeron/libraries/blueprints, each file loaded when opened),
// opened on the ERP village.

export default function BlueprintDemo() {
  return <BlueprintViewer library={library} initial="erp-village.bp" />;
}
