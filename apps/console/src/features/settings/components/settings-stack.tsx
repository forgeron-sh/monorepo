import type { ReactNode } from "react";

/** The column of groups of a settings page. */
export function SettingsStack({ children }: { children: ReactNode }) {
  return <div className="fc-settings">{children}</div>;
}
