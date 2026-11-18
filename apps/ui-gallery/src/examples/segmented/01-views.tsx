import { Segmented } from "@forgeron/ui";
import { useState } from "react";

export default function Views() {
  const [view, setView] = useState("board");
  return (
    <Segmented
      label="View"
      value={view}
      onChange={setView}
      options={[
        { value: "list", label: "List" },
        { value: "board", label: "Board" },
        { value: "calendar", label: "Calendar" },
      ]}
    />
  );
}
