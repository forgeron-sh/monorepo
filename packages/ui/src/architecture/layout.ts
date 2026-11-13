import type { Interface, Manifest } from "@forgeron/manifest";

// Manifest -> diagram layout. Pure and deterministic: the same manifest gives the same nodes, edges
// and coordinates, so it is tested without a browser and the renderer only draws what it is given.
//
// What the manifest says, and so what is drawn:
//   - which interfaces the tool offers, and which of them each action is exposed on: an edge from an
//     interface to a group of actions when one of the group's actions is exposed on it;
//   - the resources the tool declares, the events it handles, its scheduled tasks, the tools it uses
//     and its profiles.
// The manifest does not say which action touches which resource (nor which tables the database has),
// so no such edge is drawn: an invented line is worse than none.

export type NodeKind =
  | "interface"
  | "group"
  | "database"
  | "files"
  | "cache"
  | "queue"
  | "secret"
  | "user-secret"
  | "connector"
  | "host"
  | "profile"
  | "event"
  | "task"
  | "tool";

export interface ActionRow {
  /** The verb under the group (`move` for `deals.move`), possibly shortened to fit. */
  label: string;
  access: string;
}

export interface DiagramNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Shown in the node, shortened to fit. */
  title: string;
  subtitle?: string;
  /** The actions of a group. */
  rows?: ActionRow[];
  /** An interface the tool does not offer. */
  off?: boolean;
  /** The full text of the node, for screen readers and the list fallback. */
  text: string;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  /** Orthogonal route from the right side of `from` to the left side of `to`. */
  points: Array<[number, number]>;
  /** What the edge says, for the text alternative. */
  text: string;
}

export interface DiagramSection {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  nodes: string[];
}

export interface DiagramLayout {
  width: number;
  height: number;
  sections: DiagramSection[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const INTERFACE_LABELS: Record<Interface, string> = {
  mcp: "MCP",
  api: "API",
  cli: "CLI",
  web: "Web",
};
const INTERFACE_ORDER: readonly Interface[] = ["mcp", "api", "cli", "web"];

const WIDTH = 840;
const TITLE_H = 28; // a section's title row
const INTERFACE_X = 0;
const INTERFACE_W = 112;
const INTERFACE_H = 52;
const GROUP_X = 184;
const GROUP_W = 300;
const GROUP_HEADER_H = 34;
const ROW_H = 22;
const GROUP_PAD = 10;
const RESOURCE_X = 556;
const RESOURCE_W = WIDTH - RESOURCE_X;
const RESOURCE_H = 58;
const GAP = 12;
const BAND_GAP = 40;
const BOTTOM_W = 258;
const BOTTOM_GAP = (WIDTH - 3 * BOTTOM_W) / 2;
const BOTTOM_H = 58;

// Mono 12px is about 7.2 units a character; a title is 13px sans, close enough.
const CHAR_W = 7.4;

/** Shortens `text` to what fits `width` units, ending with an ellipsis when it was cut. */
function fit(text: string, width: number): string {
  const max = Math.max(4, Math.floor(width / CHAR_W));
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

const byName = (a: string, b: string) => a.localeCompare(b);

function groupOf(action: string): { group: string; verb: string } {
  const dot = action.indexOf(".");
  return dot === -1
    ? { group: "", verb: action }
    : { group: action.slice(0, dot), verb: action.slice(dot + 1) };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Lays a manifest out as nodes and edges with coordinates in a `width` by `height` box. */
export function layoutArchitecture(manifest: Manifest): DiagramLayout {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const sections: DiagramSection[] = [];

  // Actions, by group.
  const groups = new Map<
    string,
    Array<{ name: string; verb: string; action: Manifest["actions"][string] }>
  >();
  for (const name of Object.keys(manifest.actions).sort(byName)) {
    const { group, verb } = groupOf(name);
    const list = groups.get(group) ?? [];
    list.push({ name, verb, action: manifest.actions[name]! });
    groups.set(group, list);
  }
  // Ungrouped actions (no dot) come last.
  const groupNames = [...groups.keys()].sort((a, b) =>
    a === "" ? 1 : b === "" ? -1 : a.localeCompare(b),
  );

  const top = TITLE_H;
  let y = top;
  const groupIds = new Map<string, string>();
  const groupRoom = GROUP_W - 24;
  for (const group of groupNames) {
    const members = groups.get(group)!;
    const label = group === "" ? "Ungrouped" : group;
    const id = `group:${group || "_"}`;
    groupIds.set(group, id);
    const height = GROUP_HEADER_H + members.length * ROW_H + GROUP_PAD;
    nodes.push({
      id,
      kind: "group",
      x: GROUP_X,
      y,
      width: GROUP_W,
      height,
      title: fit(label, groupRoom - 70),
      subtitle: plural(members.length, "action"),
      rows: members.map((m) => ({ label: fit(m.verb, groupRoom - 110), access: m.action.access })),
      text: `Action group ${label}: ${members
        .map((m) => `${m.name}, ${m.action.access} access`)
        .join("; ")}.`,
    });
    y += height + GAP;
  }
  const groupsBottom = groupNames.length > 0 ? y - GAP : top;
  if (groupNames.length > 0) {
    sections.push({
      id: "actions",
      title: "Actions",
      x: GROUP_X,
      y: 0,
      width: GROUP_W,
      nodes: groupNames.map((g) => groupIds.get(g)!),
    });
  }

  // Interfaces.
  const interfaceNodes = INTERFACE_ORDER.map((name, index): DiagramNode => {
    const on = manifest.interfaces[name];
    const exposed = Object.values(manifest.actions).filter(
      (a) => on && a.interfaces.includes(name),
    ).length;
    return {
      id: `interface:${name}`,
      kind: "interface",
      x: INTERFACE_X,
      y: top + index * (INTERFACE_H + GAP),
      width: INTERFACE_W,
      height: INTERFACE_H,
      title: INTERFACE_LABELS[name],
      subtitle: on ? plural(exposed, "action") : "off",
      off: !on,
      text: on
        ? `Interface ${INTERFACE_LABELS[name]}: exposes ${plural(exposed, "action")}.`
        : `Interface ${INTERFACE_LABELS[name]}: not offered by this tool.`,
    };
  });
  nodes.push(...interfaceNodes);
  sections.push({
    id: "interfaces",
    title: "Interfaces",
    x: INTERFACE_X,
    y: 0,
    width: INTERFACE_W,
    nodes: interfaceNodes.map((n) => n.id),
  });

  // Interface -> group, only where an action of the group is exposed on the interface. Each
  // interface routes through its own vertical lane so the lines stay apart.
  const laneSpace = GROUP_X - (INTERFACE_X + INTERFACE_W);
  for (const [index, name] of INTERFACE_ORDER.entries()) {
    if (!manifest.interfaces[name]) continue;
    const from = interfaceNodes[index]!;
    const laneX =
      INTERFACE_X + INTERFACE_W + (laneSpace * (index + 1)) / (INTERFACE_ORDER.length + 1);
    for (const group of groupNames) {
      const exposedAny = groups.get(group)!.some((m) => m.action.interfaces.includes(name));
      if (!exposedAny) continue;
      const to = nodes.find((n) => n.id === groupIds.get(group))!;
      const y1 = from.y + from.height / 2;
      const y2 = to.y + GROUP_HEADER_H / 2;
      edges.push({
        id: `${from.id}>${to.id}`,
        from: from.id,
        to: to.id,
        points: [
          [from.x + from.width, y1],
          [laneX, y1],
          [laneX, y2],
          [to.x, y2],
        ],
        text: `${INTERFACE_LABELS[name]} exposes the ${to.title} actions.`,
      });
    }
  }

  // Resources.
  const resources: DiagramNode[] = [];
  const resource = (
    id: string,
    kind: NodeKind,
    title: string,
    detail: string | undefined,
    text: string,
  ) => {
    resources.push({
      id,
      kind,
      x: RESOURCE_X,
      y: top + resources.length * (RESOURCE_H + GAP),
      width: RESOURCE_W,
      height: RESOURCE_H,
      title: fit(title, RESOURCE_W - 24),
      ...(detail ? { subtitle: fit(detail, RESOURCE_W - 24) } : {}),
      text,
    });
  };
  const r = manifest.resources;
  if (r.db) {
    resource(
      "resource:db",
      "database",
      "Database",
      r.db.why ?? "D1",
      `Database (${r.db.engine.toUpperCase()})${r.db.why ? `: ${r.db.why}` : ""}.`,
    );
  }
  if (r.files) {
    resource(
      "resource:files",
      "files",
      "Files",
      `Up to ${r.files.maxSize}`,
      `File storage, up to ${r.files.maxSize}, types ${r.files.types.join(", ")}${r.files.why ? `: ${r.files.why}` : ""}.`,
    );
  }
  if (r.cache)
    resource(
      "resource:cache",
      "cache",
      "Cache",
      r.cache.why,
      `Cache${r.cache.why ? `: ${r.cache.why}` : ""}.`,
    );
  if (r.queue)
    resource(
      "resource:queue",
      "queue",
      "Queue",
      r.queue.why,
      `Queue${r.queue.why ? `: ${r.queue.why}` : ""}.`,
    );
  for (const name of Object.keys(r.connectors ?? {}).sort(byName)) {
    const c = r.connectors![name]!;
    const detail = `${c.mode === "delegated" ? "On behalf of the person" : "As the application"}${c.scopes.length ? ` · ${c.scopes.join(", ")}` : ""}`;
    resource(
      `connector:${name}`,
      "connector",
      `${name} (${c.type})`,
      detail,
      `Connector ${name}, type ${c.type}, ${c.mode} mode, scopes ${c.scopes.join(", ") || "none"}: ${c.why}.`,
    );
  }
  for (const name of Object.keys(r.secrets ?? {}).sort(byName)) {
    const why = r.secrets![name]!.why;
    resource(
      `secret:${name}`,
      "secret",
      name,
      why ?? "Workspace secret",
      `Workspace secret ${name}${why ? `: ${why}` : ""}.`,
    );
  }
  for (const name of Object.keys(r.userSecrets ?? {}).sort(byName)) {
    const s = r.userSecrets![name]!;
    resource(
      `user-secret:${name}`,
      "user-secret",
      name,
      `Asked from each person · ${s.label}`,
      `Personal secret ${name} (${s.label}), set by each person: ${s.why}.`,
    );
  }
  for (const host of [...(r.network?.allow ?? [])].sort(byName)) {
    resource(
      `host:${host}`,
      "host",
      host,
      r.network!.why,
      `Allowed outbound host ${host}: ${r.network!.why}.`,
    );
  }
  nodes.push(...resources);
  if (resources.length > 0) {
    sections.push({
      id: "resources",
      title: "Resources",
      x: RESOURCE_X,
      y: 0,
      width: RESOURCE_W,
      nodes: resources.map((n) => n.id),
    });
  }

  // Below: profiles, events and tasks, the tools it uses.
  const resourcesBottom =
    resources.length > 0 ? top + resources.length * (RESOURCE_H + GAP) - GAP : top;
  const interfacesBottom = top + INTERFACE_ORDER.length * (INTERFACE_H + GAP) - GAP;
  const bandTop = Math.max(groupsBottom, resourcesBottom, interfacesBottom) + BAND_GAP;
  let bandBottom = bandTop;

  const bottom = (
    column: number,
    id: string,
    title: string,
    items: Array<{ id: string; kind: NodeKind; title: string; subtitle?: string; text: string }>,
  ) => {
    if (items.length === 0) return;
    const x = column * (BOTTOM_W + BOTTOM_GAP);
    const ids: string[] = [];
    items.forEach((item, index) => {
      ids.push(item.id);
      nodes.push({
        id: item.id,
        kind: item.kind,
        x,
        y: bandTop + TITLE_H + index * (BOTTOM_H + GAP),
        width: BOTTOM_W,
        height: BOTTOM_H,
        title: fit(item.title, BOTTOM_W - 24),
        ...(item.subtitle ? { subtitle: fit(item.subtitle, BOTTOM_W - 24) } : {}),
        text: item.text,
      });
    });
    sections.push({ id, title, x, y: bandTop, width: BOTTOM_W, nodes: ids });
    bandBottom = Math.max(bandBottom, bandTop + TITLE_H + items.length * (BOTTOM_H + GAP) - GAP);
  };

  bottom(
    0,
    "profiles",
    "Profiles",
    Object.keys(manifest.profiles)
      .sort(byName)
      .map((name) => {
        const profile = manifest.profiles[name]!;
        const grants = profile.grants.join(", ") || "no access";
        return {
          id: `profile:${name}`,
          kind: "profile" as const,
          title: profile.label ?? name,
          subtitle: grants,
          text: `Profile ${profile.label ?? name}${profile.label ? ` (${name})` : ""}: ${profile.grants.length ? `grants ${grants}` : "grants no access level"}.`,
        };
      }),
  );

  const eventItems = Object.keys(manifest.events)
    .sort(byName)
    .map((name) => {
      const handler = manifest.events[name]!;
      return {
        id: `event:${name}`,
        kind: "event" as const,
        title: name,
        subtitle: `on ${handler.event} · ${handler.mode}`,
        text: `Event handler ${name}: runs on ${handler.event}, ${handler.mode === "sync" ? "inside the action" : "after the action succeeded, from a queue"}.`,
      };
    });
  const taskItems = Object.keys(manifest.jobs)
    .sort(byName)
    .map((name) => {
      const job = manifest.jobs[name]!;
      const when = `${job.cron}${job.timezone ? ` ${job.timezone}` : ""}`;
      return {
        id: `task:${name}`,
        kind: "task" as const,
        title: name,
        subtitle: when,
        text: `Scheduled task ${name}: cron ${when}${job.description ? `. ${job.description}` : ""}.`,
      };
    });
  bottom(1, "events", "Events", eventItems);
  // Tasks go under the events when there are any, else in the same column.
  if (taskItems.length > 0) {
    const eventsHeight = eventItems.length > 0 ? eventItems.length * (BOTTOM_H + GAP) + TITLE_H : 0;
    const x = BOTTOM_W + BOTTOM_GAP;
    const top0 = bandTop + eventsHeight;
    const ids: string[] = [];
    taskItems.forEach((item, index) => {
      ids.push(item.id);
      nodes.push({
        id: item.id,
        kind: item.kind,
        x,
        y: top0 + TITLE_H + index * (BOTTOM_H + GAP),
        width: BOTTOM_W,
        height: BOTTOM_H,
        title: fit(item.title, BOTTOM_W - 24),
        subtitle: fit(item.subtitle, BOTTOM_W - 24),
        text: item.text,
      });
    });
    sections.push({
      id: "tasks",
      title: "Scheduled tasks",
      x,
      y: top0,
      width: BOTTOM_W,
      nodes: ids,
    });
    bandBottom = Math.max(bandBottom, top0 + TITLE_H + taskItems.length * (BOTTOM_H + GAP) - GAP);
  }

  bottom(
    2,
    "uses",
    "Tools it uses",
    Object.keys(manifest.uses)
      .sort(byName)
      .map((name) => ({
        id: `tool:${name}`,
        kind: "tool" as const,
        title: name,
        subtitle: manifest.uses[name]!,
        text: `Uses the tool ${name}, version ${manifest.uses[name]!}.`,
      })),
  );

  // Reading order, for the text list: left to right, then top to bottom.
  const order = ["interfaces", "actions", "resources", "profiles", "events", "tasks", "uses"];
  sections.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return { width: WIDTH, height: bandBottom, sections, nodes, edges };
}
