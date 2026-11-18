import { DisplayMenu, type DisplayOptions } from "@forgeron/ui";
import { useState } from "react";

const initial: DisplayOptions = {
  layout: "list",
  grouping: "status",
  ordering: "priority",
  toggles: { subIssues: true, emptyGroups: false },
  properties: ["id", "status", "priority", "labels", "assignee"],
};

export default function Default() {
  const [display, setDisplay] = useState(initial);
  return (
    <DisplayMenu
      value={display}
      onChange={setDisplay}
      defaultValue={initial}
      groupings={[
        { value: "status", label: "Status" },
        { value: "assignee", label: "Assignee" },
        { value: "project", label: "Project" },
        { value: "priority", label: "Priority" },
        { value: "none", label: "No grouping" },
      ]}
      orderings={[
        { value: "priority", label: "Priority" },
        { value: "due", label: "Due date" },
        { value: "created", label: "Created" },
        { value: "updated", label: "Updated" },
      ]}
      toggles={[
        { id: "subIssues", label: "Show sub-issues" },
        { id: "emptyGroups", label: "Show empty groups" },
      ]}
      properties={[
        { id: "id", label: "ID" },
        { id: "status", label: "Status" },
        { id: "priority", label: "Priority" },
        { id: "labels", label: "Labels" },
        { id: "project", label: "Project" },
        { id: "due", label: "Due date" },
        { id: "assignee", label: "Assignee" },
      ]}
    />
  );
}
