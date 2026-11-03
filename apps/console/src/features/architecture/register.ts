import type { ComponentType } from "react";
import type { Api } from "../../api";

/** What the tool page's tab registry (`features/tools/tabs.ts`, FOR-134) takes. */
export interface ToolTabRegistration {
  id: string;
  title: string;
  adminOnly: boolean;
  load: () => Promise<{ default: ComponentType<{ tool: string; api: Api }> }>;
}

export const architectureTab: ToolTabRegistration = {
  id: "architecture",
  title: "Architecture",
  // The manifest route answers developers and admins only.
  adminOnly: true,
  load: async () => ({ default: (await import("./ArchitectureTab")).ArchitectureTab }),
};

/** One line in the registry's module: `registerArchitectureTab(registerToolTab)`. */
export function registerArchitectureTab(register: (tab: ToolTabRegistration) => void): void {
  register(architectureTab);
}
