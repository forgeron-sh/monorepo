import { diffSchema, type DeltaKind, type Json } from "./json-schema";
import { BUILT_IN_ACCESS_LEVELS, type Action, type Manifest, type Resources } from "./schema";

// Compares two manifests and states the minimum semver impact (sdk.md §16).
// Changes the table of §16 does not list follow one rule: what can break an existing
// caller is `major`, what only adds is `minor`, the rest is `patch`.

export type Impact = "none" | "patch" | "minor" | "major";

export type ChangeKind =
  | "tool.renamed"
  | "tool.text-changed"
  | "tool.interface-added"
  | "tool.interface-removed"
  | "tool.preview-changed"
  | "profile.added"
  | "profile.removed"
  | "profile.grant-added"
  | "profile.grant-removed"
  | "profile.label-changed"
  | "action.added"
  | "action.removed"
  | "action.description-changed"
  | "action.access-raised"
  | "action.access-lowered"
  | "action.http-method-changed"
  | "action.cli-args-changed"
  | "action.interface-added"
  | "action.interface-removed"
  | "action.confirm-changed"
  | "action.rate-limit-changed"
  | "action.output-declared"
  | "action.output-dropped"
  | "input.field-added-required"
  | "input.field-added-optional"
  | "input.field-removed"
  | "input.field-made-required"
  | "input.field-made-optional"
  | "input.field-narrowed"
  | "input.field-widened"
  | "input.field-incompatible"
  | "output.field-added-required"
  | "output.field-added-optional"
  | "output.field-removed"
  | "output.field-made-required"
  | "output.field-made-optional"
  | "output.field-narrowed"
  | "output.field-widened"
  | "output.field-incompatible"
  | "view.added"
  | "view.removed"
  | "view.path-changed"
  | "view.access-raised"
  | "view.access-lowered"
  | "view.title-changed"
  | "job.added"
  | "job.removed"
  | "job.changed"
  | "event.added"
  | "event.removed"
  | "event.changed"
  | "resource.added"
  | "resource.removed"
  | "resource.broadened"
  | "resource.narrowed"
  | "resource.why-changed"
  | "setup.field-added"
  | "setup.field-removed"
  | "setup.field-changed"
  | "setup.check-changed"
  | "uses.added"
  | "uses.removed"
  | "uses.range-changed";

export interface Change {
  kind: ChangeKind;
  /** What changed, as a dotted path: `actions.deals.move`, `resources.network`. */
  subject: string;
  impact: Exclude<Impact, "none">;
  detail?: string;
  /** Set on a resource that is added or broadened: an admin must accept it (sdk.md §3). */
  needsApproval?: true;
}

export interface ManifestDiff {
  changes: Change[];
  /** True when at least one change needs approval before production. */
  pendingApproval: boolean;
  /** The strongest impact among the changes; `none` when the manifests are equivalent. */
  impact: Impact;
}

const RANK: Record<Impact, number> = { none: 0, patch: 1, minor: 2, major: 3 };

export function maxImpact(a: Impact, b: Impact): Impact {
  return RANK[a] >= RANK[b] ? a : b;
}

const INPUT_IMPACT: Record<DeltaKind, Change["impact"]> = {
  "added-required": "major",
  "added-optional": "minor",
  removed: "major",
  "made-required": "major",
  "made-optional": "minor",
  narrowed: "major",
  widened: "minor",
  incompatible: "major",
};

// A consumer reads what an action returns: a wider output breaks it, a narrower one does not.
const OUTPUT_IMPACT: Record<DeltaKind, Change["impact"]> = {
  "added-required": "minor",
  "added-optional": "minor",
  removed: "major",
  "made-required": "minor",
  "made-optional": "major",
  narrowed: "minor",
  widened: "major",
  incompatible: "major",
};

const DELTA_SLUG: Record<DeltaKind, string> = {
  "added-required": "field-added-required",
  "added-optional": "field-added-optional",
  removed: "field-removed",
  "made-required": "field-made-required",
  "made-optional": "field-made-optional",
  narrowed: "field-narrowed",
  widened: "field-widened",
  incompatible: "field-incompatible",
};

export function diffManifests(previous: Manifest, next: Manifest): ManifestDiff {
  const changes: Change[] = [];
  const add = (kind: ChangeKind, subject: string, impact: Change["impact"], detail?: string) => {
    changes.push(
      detail === undefined ? { kind, subject, impact } : { kind, subject, impact, detail },
    );
  };

  diffTool(previous, next, add);
  diffProfiles(previous.profiles, next.profiles, add);
  diffKeyed(previous.actions, next.actions, {
    added: (name) => add("action.added", `actions.${name}`, "minor"),
    removed: (name) => add("action.removed", `actions.${name}`, "major"),
    both: (name, before, after) => diffAction(name, before, after, add),
  });
  diffKeyed(previous.views, next.views, {
    added: (name) => add("view.added", `views.${name}`, "minor"),
    removed: (name) => add("view.removed", `views.${name}`, "major"),
    both: (name, before, after) => {
      const subject = `views.${name}`;
      if (before.path !== after.path) {
        add("view.path-changed", subject, "major", `${before.path} → ${after.path}`);
      }
      diffAccess("view", subject, before.access, after.access, add);
      if (before.title !== after.title) add("view.title-changed", subject, "patch");
      diffParams(subject, before.params, after.params, add);
    },
  });
  diffKeyed(previous.jobs, next.jobs, {
    added: (name) => add("job.added", `jobs.${name}`, "minor"),
    removed: (name) => add("job.removed", `jobs.${name}`, "minor"),
    both: (name, before, after) => {
      if (before.cron !== after.cron || before.timezone !== after.timezone) {
        add("job.changed", `jobs.${name}`, "minor");
      }
    },
  });
  // A handler reacts to what actions emit: another one, or none, changes what a version does.
  diffKeyed(previous.events, next.events, {
    added: (name) => add("event.added", `events.${name}`, "minor"),
    removed: (name) => add("event.removed", `events.${name}`, "minor"),
    both: (name, before, after) => {
      if (before.event !== after.event || before.mode !== after.mode) {
        add("event.changed", `events.${name}`, "minor");
      }
    },
  });
  diffResources(previous.resources, next.resources, add);
  diffSetup(previous.setup, next.setup, add);
  diffKeyed(previous.uses, next.uses, {
    added: (name) => add("uses.added", `uses.${name}`, "minor"),
    removed: (name) => add("uses.removed", `uses.${name}`, "patch"),
    both: (name, before, after) => {
      if (before !== after)
        add("uses.range-changed", `uses.${name}`, "minor", `${before} → ${after}`);
    },
  });

  // A removed or narrowed resource asks for nothing.
  const flagged = changes.map((change) =>
    change.kind === "resource.added" || change.kind === "resource.broadened"
      ? { ...change, needsApproval: true as const }
      : change,
  );
  const impact = flagged.reduce<Impact>((acc, change) => maxImpact(acc, change.impact), "none");
  return { changes: flagged, impact, pendingApproval: flagged.some((c) => c.needsApproval) };
}

/**
 * The plain fields of a setup (D-096). A new field makes everyone fill it in at their next use, so it
 * is a `minor`; a field made required does the same; a removed one is a `patch`. Not a resource: an
 * admin approves nothing here (the secret fields are `resources.userSecrets`, which are approved).
 */
function diffSetup(previous: Manifest["setup"], next: Manifest["setup"], add: Add): void {
  diffKeyed(previous?.fields ?? {}, next?.fields ?? {}, {
    added: (name) => add("setup.field-added", `setup.fields.${name}`, "minor"),
    removed: (name) => add("setup.field-removed", `setup.fields.${name}`, "patch"),
    both: (name, before, after) => {
      if (sameJson(before, after)) return;
      const subject = `setup.fields.${name}`;
      const madeRequired = !before.required && after.required;
      add(
        "setup.field-changed",
        subject,
        madeRequired || before.type !== after.type ? "minor" : "patch",
      );
    },
  });
  if (previous?.check !== next?.check) add("setup.check-changed", "setup.check", "patch");
}

type Add = (kind: ChangeKind, subject: string, impact: Change["impact"], detail?: string) => void;

function diffKeyed<T>(
  previous: Record<string, T>,
  next: Record<string, T>,
  on: {
    added: (key: string, value: T) => void;
    removed: (key: string, value: T) => void;
    both: (key: string, before: T, after: T) => void;
  },
): void {
  for (const [key, before] of Object.entries(previous)) {
    const after = next[key];
    if (after === undefined) on.removed(key, before);
    else on.both(key, before, after);
  }
  for (const [key, after] of Object.entries(next)) {
    if (previous[key] === undefined) on.added(key, after);
  }
}

function setDiff<T>(before: readonly T[], after: readonly T[]) {
  return {
    added: after.filter((x) => !before.includes(x)),
    removed: before.filter((x) => !after.includes(x)),
  };
}

function diffTool(previous: Manifest, next: Manifest, add: Add): void {
  if (previous.name !== next.name)
    add("tool.renamed", "name", "major", `${previous.name} → ${next.name}`);
  if (previous.title !== next.title) add("tool.text-changed", "title", "patch");
  if (previous.description !== next.description) add("tool.text-changed", "description", "patch");
  if (previous.summary !== next.summary) add("tool.text-changed", "summary", "patch");
  if (previous.preview.data !== next.preview.data)
    add("tool.preview-changed", "preview.data", "patch");
  for (const key of ["mcp", "api", "cli", "web"] as const) {
    if (previous.interfaces[key] && !next.interfaces[key]) {
      add("tool.interface-removed", `interfaces.${key}`, "major");
    } else if (!previous.interfaces[key] && next.interfaces[key]) {
      add("tool.interface-added", `interfaces.${key}`, "minor");
    }
  }
}

// Fewer grants means people lose something they had; more grants only adds.
function diffProfiles(previous: Manifest["profiles"], next: Manifest["profiles"], add: Add): void {
  diffKeyed(previous, next, {
    added: (name) => add("profile.added", `profiles.${name}`, "minor"),
    removed: (name) => add("profile.removed", `profiles.${name}`, "major"),
    both: (name, before, after) => {
      const { added, removed } = setDiff(before.grants, after.grants);
      for (const level of removed) add("profile.grant-removed", `profiles.${name}`, "major", level);
      for (const level of added) add("profile.grant-added", `profiles.${name}`, "minor", level);
      if (before.label !== after.label) add("profile.label-changed", `profiles.${name}`, "patch");
    },
  });
}

type AccessMove = "same" | "raised" | "lowered";

// Levels outside the built-in ladder have no known order: any move is treated as a raise.
function accessMove(before: string, after: string): AccessMove {
  if (before === after) return "same";
  const ladder: readonly string[] = BUILT_IN_ACCESS_LEVELS;
  const from = ladder.indexOf(before);
  const to = ladder.indexOf(after);
  if (from === -1 || to === -1) return "raised";
  return to > from ? "raised" : "lowered";
}

function diffAccess(
  scope: "action" | "view",
  subject: string,
  before: string,
  after: string,
  add: Add,
): void {
  const move = accessMove(before, after);
  const detail = `${before} → ${after}`;
  if (move === "raised") add(`${scope}.access-raised`, subject, "major", detail);
  else if (move === "lowered") add(`${scope}.access-lowered`, subject, "minor", detail);
}

function diffAction(name: string, before: Action, after: Action, add: Add): void {
  const subject = `actions.${name}`;
  if (before.description !== after.description) add("action.description-changed", subject, "patch");
  diffAccess("action", subject, before.access, after.access, add);
  if (before.http.method !== after.http.method) {
    add(
      "action.http-method-changed",
      subject,
      "major",
      `${before.http.method} → ${after.http.method}`,
    );
  }
  if (before.cli.args.join() !== after.cli.args.join()) {
    add("action.cli-args-changed", subject, "major");
  }
  const interfaces = setDiff(before.interfaces, after.interfaces);
  for (const key of interfaces.removed) add("action.interface-removed", subject, "major", key);
  for (const key of interfaces.added) add("action.interface-added", subject, "minor", key);
  if (before.confirm !== after.confirm) add("action.confirm-changed", subject, "minor");
  if (JSON.stringify(before.rateLimit) !== JSON.stringify(after.rateLimit)) {
    add("action.rate-limit-changed", subject, "minor");
  }

  schemaChanges(`${subject}.input`, before.input, after.input, INPUT_IMPACT, "input", add);
  if (before.output && after.output) {
    schemaChanges(`${subject}.output`, before.output, after.output, OUTPUT_IMPACT, "output", add);
  } else if (!before.output && after.output) {
    add("action.output-declared", subject, "minor");
  } else if (before.output && !after.output) {
    add("action.output-dropped", subject, "major");
  }
}

function diffParams(
  subject: string,
  before: Json | undefined,
  after: Json | undefined,
  add: Add,
): void {
  if (before && after)
    schemaChanges(`${subject}.params`, before, after, INPUT_IMPACT, "input", add);
}

function schemaChanges(
  subject: string,
  before: Json,
  after: Json,
  impacts: Record<DeltaKind, Change["impact"]>,
  side: "input" | "output",
  add: Add,
): void {
  for (const delta of diffSchema(before, after)) {
    const kind = `${side}.${DELTA_SLUG[delta.kind]}` as ChangeKind;
    const at = delta.path ? `${subject}.${delta.path}` : subject;
    add(kind, at, impacts[delta.kind]);
  }
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function withoutWhy<T extends { why?: string | undefined }>(value: T): Omit<T, "why"> {
  const { why: _, ...rest } = value;
  return rest;
}

// A resource that is added or broadened is a `minor`; a removed or narrowed one is not
// worth more than a `patch`. The approval workflow is a separate concern (sdk.md §3).
/**
 * The changes between two sets of resources alone, the part an admin must accept (sdk.md §3):
 * what a version asks for that the previous one did not.
 */
export function diffResourceChanges(previous: Resources, next: Resources): Change[] {
  const changes: Change[] = [];
  diffResources(previous, next, (kind, subject, impact, detail) => {
    changes.push(
      detail === undefined ? { kind, subject, impact } : { kind, subject, impact, detail },
    );
  });
  return changes.map((change) =>
    change.kind === "resource.added" || change.kind === "resource.broadened"
      ? { ...change, needsApproval: true as const }
      : change,
  );
}

function diffResources(previous: Resources, next: Resources, add: Add): void {
  for (const key of ["db", "files", "cache", "queue"] as const) {
    const before = previous[key];
    const after = next[key];
    const subject = `resources.${key}`;
    if (!before && after) add("resource.added", subject, "minor");
    else if (before && !after) add("resource.removed", subject, "patch");
    else if (before && after) {
      if (!sameJson(withoutWhy(before), withoutWhy(after)))
        add("resource.broadened", subject, "minor");
      else if (before.why !== after.why) add("resource.why-changed", subject, "patch");
    }
  }

  const network = [previous.network, next.network] as const;
  if (!network[0] && network[1]) add("resource.added", "resources.network", "minor");
  else if (network[0] && !network[1]) add("resource.removed", "resources.network", "patch");
  else if (network[0] && network[1]) {
    const { added, removed } = setDiff(network[0].allow, network[1].allow);
    for (const host of added) add("resource.broadened", "resources.network", "minor", host);
    for (const host of removed) add("resource.narrowed", "resources.network", "patch", host);
    if (!added.length && !removed.length && network[0].why !== network[1].why) {
      add("resource.why-changed", "resources.network", "patch");
    }
  }

  diffKeyed(previous.secrets ?? {}, next.secrets ?? {}, {
    added: (name) => add("resource.added", `resources.secrets.${name}`, "minor"),
    removed: (name) => add("resource.removed", `resources.secrets.${name}`, "patch"),
    both: (name, before, after) => {
      if (before.why !== after.why)
        add("resource.why-changed", `resources.secrets.${name}`, "patch");
    },
  });
  diffKeyed(previous.userSecrets ?? {}, next.userSecrets ?? {}, {
    added: (name) => add("resource.added", `resources.userSecrets.${name}`, "minor"),
    removed: (name) => add("resource.removed", `resources.userSecrets.${name}`, "patch"),
    both: (name, before, after) => {
      if (sameJson(before, after)) return;
      add("resource.why-changed", `resources.userSecrets.${name}`, "patch");
    },
  });
  diffKeyed(previous.connectors ?? {}, next.connectors ?? {}, {
    added: (name) => add("resource.added", `resources.connectors.${name}`, "minor"),
    removed: (name) => add("resource.removed", `resources.connectors.${name}`, "patch"),
    both: (name, before, after) => {
      const subject = `resources.connectors.${name}`;
      const scopes = setDiff(before.scopes, after.scopes);
      for (const scope of scopes.added) add("resource.broadened", subject, "minor", scope);
      for (const scope of scopes.removed) add("resource.narrowed", subject, "patch", scope);
      if (before.type !== after.type || before.mode !== after.mode) {
        add(
          "resource.broadened",
          subject,
          "minor",
          `${before.type}/${before.mode} → ${after.type}/${after.mode}`,
        );
      }
      if (before.why !== after.why) add("resource.why-changed", subject, "patch");
    },
  });
}
