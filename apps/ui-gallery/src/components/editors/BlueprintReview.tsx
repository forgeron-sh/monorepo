import { DepthReview } from "@forgeron/blueprint-canvas";
import { library } from "virtual:blueprint-library";

// Every scene of the site's library in painter's order and with the z-buffer, side by side.
export default function BlueprintReview() {
  return <DepthReview library={library} />;
}
