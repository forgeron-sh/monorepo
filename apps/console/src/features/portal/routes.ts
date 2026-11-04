import type { RouteDef } from "../../shell/routes";
import { registerOverviewTab } from "./register";

// The member space adds its tab to the tool page; the Home route is declared in the shell's table.
registerOverviewTab();

const routes: RouteDef[] = [];
export default routes;
