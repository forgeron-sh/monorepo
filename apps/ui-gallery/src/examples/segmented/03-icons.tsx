import { GridViewIcon, Menu01Icon } from "@forgeron/icons";
import { Icon, Segmented } from "@forgeron/ui";
import { useState } from "react";

export default function Icons() {
  const [view, setView] = useState("grid");
  return (
    <Segmented
      label="Layout"
      iconOnly
      value={view}
      onChange={setView}
      options={[
        { value: "grid", label: <Icon icon={GridViewIcon} size={12} />, ariaLabel: "Grid" },
        { value: "list", label: <Icon icon={Menu01Icon} size={12} />, ariaLabel: "List" },
      ]}
    />
  );
}
