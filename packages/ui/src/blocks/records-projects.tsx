// The fields of a project (lists-projects-table's `ProjectItem`), the second preset of the records
// model: the same list and board as the issues, with another set of fields.

import { StatusGlyph, type StatusKind } from "../glyphs";
import { defineStatuses } from "../status-model";
import {
  PROJECT_HEALTH_NAMES,
  PROJECT_STATUS_NAMES,
  type ProjectItem,
  type ProjectStatus,
} from "./lists-projects-table";
import { defineFields } from "./records-model";

const GLYPH: Record<ProjectStatus, StatusKind> = {
  planned: "todo",
  started: "progress",
  paused: "backlog",
  completed: "done",
  canceled: "canceled",
};
const status = (key: ProjectStatus, tone: "neutral" | "success" | "warning") => ({
  label: PROJECT_STATUS_NAMES[key],
  tone,
  glyph: <StatusGlyph status={GLYPH[key]} />,
});

/** The five states of a project, in the order of the Projects page. */
export const PROJECT_STATUSES = defineStatuses({
  started: status("started", "warning"),
  paused: status("paused", "neutral"),
  planned: status("planned", "neutral"),
  completed: status("completed", "success"),
  canceled: status("canceled", "neutral"),
});

/** How a project is going: on track, at risk, off track, or no news. */
export const PROJECT_HEALTHS = defineStatuses({
  off: { label: PROJECT_HEALTH_NAMES.off, tone: "danger" },
  risk: { label: PROJECT_HEALTH_NAMES.risk, tone: "warning" },
  track: { label: PROJECT_HEALTH_NAMES.track, tone: "success" },
  none: { label: PROJECT_HEALTH_NAMES.none, tone: "neutral" },
});

/** The fields of a `ProjectItem`: its list and its board are `RecordList` and `RecordBoard`. */
export const projectFields = defineFields<ProjectItem>({
  status: {
    label: "Status",
    kind: "status",
    get: (r) => r.status,
    options: PROJECT_STATUSES,
    place: { row: "lead", card: "lead" },
  },
  name: { label: "Name", kind: "text", get: (r) => r.name },
  health: {
    label: "Health",
    kind: "enum",
    get: (r) => r.health ?? "none",
    options: PROJECT_HEALTHS,
    none: "none",
    place: { card: "chips" },
  },
  lead: {
    label: "Lead",
    kind: "person",
    empty: "No lead",
    get: (r) => r.lead,
    place: { card: "who" },
  },
  target: {
    label: "Target date",
    kind: "date",
    prefix: "Target ",
    get: (r) => r.target,
    place: { card: "foot" },
  },
  issues: { label: "Issues", kind: "number", mono: true, get: (r) => r.issues },
});
