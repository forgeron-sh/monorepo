import { DepthReview } from "@forgeron/blueprint/canvas";
import { library } from "@forgeron/libraries/blueprints";

// Every scene of the Blueprint library (@forgeron/libraries/blueprints) in painter's order and with
// the z-buffer, side by side.
export default function BlueprintReview() {
  return <DepthReview library={library} />;
}
