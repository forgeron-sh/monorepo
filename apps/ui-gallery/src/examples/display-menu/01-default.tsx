// Composed from parts: a Timeline layout added after List and Board, with a Zoom choice that only
// shows for it, kept in `options.zoom`.
import { ChartGanttIcon } from "@forgeron/icons";
import {
  DEFAULT_LAYOUTS,
  DisplayLayouts,
  DisplayMenu,
  DisplayProperties,
  DisplayReset,
  DisplaySection,
  DisplaySelect,
  DisplayToggle,
  DisplayWhen,
  type DisplayOptions,
} from "@forgeron/ui";
import { useState } from "react";

const initial: DisplayOptions = {
  layout: "timeline",
  grouping: "project",
  ordering: "due",
  toggles: { milestones: true },
  properties: ["id", "assignee"],
  options: { zoom: "weeks" },
};

export default function Composed() {
  const [display, setDisplay] = useState(initial);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <DisplayMenu value={display} onChange={setDisplay} defaultValue={initial}>
        <DisplayLayouts
          layouts={[
            ...DEFAULT_LAYOUTS,
            { value: "timeline", label: "Timeline", icon: ChartGanttIcon },
          ]}
        />
        <DisplaySelect
          name="grouping"
          label="Grouping"
          options={[
            { value: "project", label: "Project" },
            { value: "assignee", label: "Assignee" },
            { value: "none", label: "No grouping" },
          ]}
        />
        <DisplaySelect
          name="ordering"
          label="Ordering"
          options={[
            { value: "due", label: "Due date" },
            { value: "priority", label: "Priority" },
          ]}
        />
        <DisplayWhen layout="timeline">
          <DisplaySection title="Timeline">
            <DisplaySelect
              name="zoom"
              label="Zoom"
              options={[
                { value: "weeks", label: "Weeks" },
                { value: "months", label: "Months" },
                { value: "quarters", label: "Quarters" },
              ]}
            />
            <DisplayToggle id="milestones" label="Show milestones" />
          </DisplaySection>
        </DisplayWhen>
        <DisplayWhen layout={["list", "board"]}>
          <DisplayProperties
            properties={[
              { id: "id", label: "ID" },
              { id: "status", label: "Status" },
              { id: "assignee", label: "Assignee" },
            ]}
          />
        </DisplayWhen>
        <DisplayReset />
      </DisplayMenu>
      <code className="t-mono" style={{ color: "var(--ink-muted)", fontSize: 12 }}>
        {display.layout} · zoom {display.options?.zoom} · milestones{" "}
        {display.toggles.milestones ? "on" : "off"}
      </code>
    </div>
  );
}
