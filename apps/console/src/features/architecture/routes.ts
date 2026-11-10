import type { RouteDef } from "../../shell/routes";
import { registerToolTab } from "../tools/tabs";

// The Architecture tab of the tool page: a diagram drawn from the tool's manifest.
registerToolTab({
  id: "architecture",
  scope: "branch",
  title: "Architecture",
  // The manifest route answers developers and admins only.
  adminOnly: true,
  order: 40,
  load: () => import("./ArchitectureTab"),
});

const routes: RouteDef[] = [];
export default routes;
