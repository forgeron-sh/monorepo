import { useEffect } from "react";
import type { PageProps } from "../../../shell/page-props";

/** `/settings` opens the first page of the area. */
export default function SettingsIndex({ go }: PageProps) {
  useEffect(() => go("/settings/profile"), [go]);
  return null;
}
