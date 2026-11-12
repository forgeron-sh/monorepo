import { addresses } from "@forgeron/platform-contract/client";
import { Badge, Button, Checkbox, Dialog, Field, Input, Menu, Notice } from "@forgeron/ui";
import { useId, useMemo, useState } from "react";
import {
  explain,
  ok,
  typedClient,
  typedSender,
  type Api,
  type FetchJson,
  type SendJson,
} from "../../api";
import { knownRoles, loadMembers, type MembershipView } from "../../members";
import { useLoad } from "../../use-load";

// Who may use a channel of the tool, at the right of its header (D-129), in place of the old
// Availability tab. Two states: **Draft**, the rule `nobody` (or no rule on a channel), for admins
// only (and developers on a branch's temporary channel, D-125); **Published**, to everyone, to some
// workspace roles, or to some people. Production's rule is who may add the tool to their library
// (D-117); another channel's is who may add that channel as a tool of its own (D-119, D-125).
// Everyone holds `member` (D-128): published to everyone is every person of the workspace. What each
// person may do in the tool stays the Access tab's.

type Mode = "nobody" | "everyone" | "roles" | "people";
export type Sharing = { mode: Mode; roles: string[]; people: string[] };

const json = (rule: Sharing) => ({
  mode: rule.mode,
  ...(rule.mode === "roles" ? { roles: rule.roles } : {}),
  ...(rule.mode === "people" ? { people: rule.people } : {}),
});

async function loadSharing(fetchJson: FetchJson, tool: string, branch?: string) {
  const client = typedClient(fetchJson);
  return ok(
    branch
      ? await client(addresses.getPilotAvailability, { params: { tool, branch } })
      : await client(addresses.getAvailability, { params: { tool } }),
  );
}
type Rule = Awaited<ReturnType<typeof loadSharing>>;

/** A saved rule as a choice: production with no rule (`open`) reaches everyone. */
const asSharing = (rule: Rule): Sharing => ({
  mode: rule.mode === "open" ? "everyone" : rule.mode,
  roles: rule.roles,
  people: rule.people,
});

async function saveSharing(send: SendJson, tool: string, rule: Sharing, branch?: string) {
  const client = typedSender(send);
  return ok(
    branch
      ? await client(addresses.putPilotAvailability, { params: { tool, branch }, json: json(rule) })
      : await client(addresses.putAvailability, { params: { tool }, json: json(rule) }),
  );
}

type Member = MembershipView["members"][number];

/** A branch's temporary channel: developers reach it while it is a draft (D-125, D-129). */
const isBranch = (branch?: string) => branch !== undefined && !branch.startsWith("~");

/** Who always reaches the channel, whatever is published. */
const alwaysLabel = (branch?: string) =>
  isBranch(branch) ? "Admins and developers" : "Admins only";

/** The people who would reach the channel under a rule: admins always, and those it names. */
export function audience(rule: Sharing, members: readonly Member[], branch?: string): Member[] {
  return members.filter((m) => {
    if (m.roles.includes("admin")) return true;
    if (isBranch(branch) && m.roles.includes("developer")) return true;
    switch (rule.mode) {
      case "everyone":
        return true;
      case "roles":
        // Everyone holds `member` (D-128), given or not.
        return rule.roles.some((r) => r === "member" || m.roles.includes(r));
      case "people":
        return rule.people.includes(m.id);
      default:
        return false;
    }
  });
}

/** What the header says after _Published_: who it is shared with. */
function sharedWith(rule: Rule, members?: readonly Member[]): string {
  switch (rule.mode) {
    case "open":
      return "everyone, without adding it";
    case "everyone":
      return "everyone";
    case "roles":
      return rule.roles.join(", ") || "no role";
    case "people": {
      if (members && rule.people.length <= 2) {
        const names = rule.people.map((id) => members.find((m) => m.id === id)?.name ?? id);
        if (names.length) return names.join(", ");
      }
      return rule.people.length === 1 ? "1 person" : `${rule.people.length} people`;
    }
    default:
      return "";
  }
}

const peopleCount = (n: number) => (n === 1 ? "1 person" : `${n} people`);

/** What the dialog says before saving: how many people get access, and why. */
function confirmation(rule: Sharing, reach: number, total: number, branch?: string): string {
  const always = isBranch(branch) ? "admins and developers" : "admins";
  const count = reach === 1 ? "1 person will" : `${reach} people will`;
  if (rule.mode === "everyone") return `${count} have access: everyone in the workspace.`;
  const who =
    rule.mode === "roles"
      ? `the people who hold ${rule.roles.join(" or ")}`
      : rule.people.length === 1
        ? "the person you picked"
        : `the ${rule.people.length} people you picked`;
  return `${count} have access, of ${total}: ${always}, and ${who}.`;
}

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export interface PublishControlProps {
  tool: string;
  /** The channel the page shows; `undefined` for production. */
  branch?: string;
  api: Api;
}

type Open = "share" | "who" | "unpublish" | undefined;

/** The channel's state and the split button that publishes it, for an admin. */
export function PublishControl({ tool, branch, api }: PublishControlProps) {
  const rule = useLoad(() => loadSharing(api.fetchJson, tool, branch), [api, tool, branch]);
  const members = useLoad(() => loadMembers(api.fetchJson), [api]);
  const [open, setOpen] = useState<Open>();
  const [done, setDone] = useState<string>();

  if (!rule.data) {
    return rule.loading ? (
      <span className="ft-publish ft-publish-state fc-muted">Loading…</span>
    ) : (
      <span className="ft-publish ft-publish-state fc-muted">Sharing could not be loaded</span>
    );
  }
  // A channel other than production with no rule is a draft; production with none is open (D-117).
  const draft = rule.data.mode === "nobody" || (branch !== undefined && rule.data.mode === "open");
  const view = members.data;
  const save = async (next: Sharing, message: string) => {
    await saveSharing(api.sendJson, tool, next, branch);
    setOpen(undefined);
    setDone(message);
    rule.reload();
  };
  const where = branch ? `${tool} · ${branch.startsWith("~") ? branch.slice(1) : branch}` : tool;

  return (
    <div className="ft-publish">
      <span className="ft-publish-state" role="status">
        {draft ? (
          <>
            <Badge tone="warning" dot>
              Draft
            </Badge>
            <span className="fc-muted">{alwaysLabel(branch)}</span>
          </>
        ) : (
          <>
            <Badge tone="success" dot>
              Published
            </Badge>
            <span className="ft-publish-who" title={sharedWith(rule.data, view?.members)}>
              {sharedWith(rule.data, view?.members)}
            </span>
          </>
        )}
      </span>
      <span className="ft-split">
        <Button
          size="sm"
          variant={draft ? "primary" : "secondary"}
          onClick={() => setOpen("share")}
          disabled={!view}
        >
          {draft ? "Publish" : "Manage sharing"}
        </Button>
        <Menu
          className={`ft-split-menu ${draft ? "ft-split-primary" : "ft-split-secondary"}`}
          label="More sharing actions"
          trigger={<Chevron />}
          entries={[
            { kind: "action", label: "Who has access", onSelect: () => setOpen("who") },
            ...(draft
              ? []
              : ([
                  { kind: "separator" },
                  {
                    kind: "action",
                    label: "Unpublish",
                    tone: "danger",
                    onSelect: () => setOpen("unpublish"),
                  },
                ] as const)),
          ]}
        />
      </span>
      {done ? (
        <span className="fc-sr" role="status">
          {done}
        </span>
      ) : null}
      {open === "share" && view ? (
        <ShareDialog
          title={draft ? `Publish ${where}` : `Manage sharing of ${where}`}
          rule={rule.data}
          view={view}
          branch={branch}
          legacy={!draft && rule.data.mode === "open"}
          action={draft ? "Publish" : "Save sharing"}
          onClose={() => setOpen(undefined)}
          save={(next) => save(next, draft ? "Published." : "Sharing saved.")}
        />
      ) : null}
      {open === "who" ? (
        <WhoDialog
          rule={draft ? { ...rule.data, mode: "nobody" } : rule.data}
          members={view?.members ?? []}
          branch={branch}
          onClose={() => setOpen(undefined)}
        />
      ) : null}
      {open === "unpublish" ? (
        <UnpublishDialog
          where={where}
          count={
            view
              ? audience(asSharing(rule.data), view.members, branch).filter(
                  (m) => !m.roles.includes("admin"),
                ).length
              : 0
          }
          branch={branch}
          onClose={() => setOpen(undefined)}
          confirm={() => save({ mode: "nobody", roles: [], people: [] }, "Back to draft.")}
        />
      ) : null}
    </div>
  );
}

function ShareDialog({
  title,
  rule,
  view,
  branch,
  legacy,
  action,
  onClose,
  save,
}: {
  title: string;
  rule: Rule;
  view: MembershipView;
  branch?: string;
  legacy: boolean;
  action: string;
  onClose: () => void;
  save: (rule: Sharing) => Promise<void>;
}) {
  const start: Mode = rule.mode === "roles" || rule.mode === "people" ? rule.mode : "everyone";
  const [mode, setMode] = useState<Mode>(start);
  const [roles, setRoles] = useState<string[]>(rule.roles);
  const [people, setPeople] = useState<string[]>(rule.people);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const name = useId();
  // `admin` always reaches the channel; `member` is everyone (D-128).
  const offered = knownRoles(view).filter((r) => r !== "admin" && r !== "member");
  const next: Sharing = { mode, roles, people };
  const reach = audience(next, view.members, branch);
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return view.members.filter(
      (m) =>
        people.includes(m.id) || (q !== "" && `${m.name} ${m.email}`.toLowerCase().includes(q)),
    );
  }, [query, people, view.members]);
  const empty =
    (mode === "roles" && roles.length === 0) || (mode === "people" && people.length === 0);

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await save(next);
    } catch (e) {
      setError(explain(e, "Sharing was not saved. Try again."));
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={title}
      description={
        branch
          ? "The people you share it with add it from their library as a tool of its own, with its own data."
          : "The people you share it with add it to their library themselves. What they may do in it is set in the Access tab."
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || empty}>
            {busy ? "Saving…" : action}
          </Button>
        </>
      }
    >
      {legacy ? (
        <Notice tone="info">
          This tool is open to everyone without being added, as before libraries. Once you save
          here, each person adds it from their library to keep using it.
        </Notice>
      ) : null}
      <fieldset className="fc-fieldset">
        <legend className="fc-legend">Share with</legend>
        {(
          [
            ["everyone", "Everyone in the workspace", "Every person of the workspace."],
            ["roles", "Some roles", "The people who hold one of these roles."],
            ["people", "Some people", "Only the people you pick."],
          ] as const
        ).map(([value, label, hint]) => (
          <label key={value} className="fc-radio">
            <input
              type="radio"
              name={name}
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
            />
            <span>
              <strong>{label}</strong> <span className="fc-muted">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {mode === "roles" ? (
        offered.length > 0 ? (
          <div className="fc-checks">
            {offered.map((r) => (
              <Checkbox
                key={r}
                label={r}
                checked={roles.includes(r)}
                onChange={(e) =>
                  setRoles(e.target.checked ? [...roles, r] : roles.filter((x) => x !== r))
                }
              />
            ))}
          </div>
        ) : (
          <p className="fc-muted">No role other than admin and member yet: give one in Members.</p>
        )
      ) : null}
      {mode === "people" ? (
        <div className="fc-stack">
          <Field label="Find people">
            {(control) => (
              <Input
                {...control}
                type="search"
                value={query}
                placeholder="Name or email"
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
          </Field>
          {found.length > 0 ? (
            <div className="fc-checks">
              {found.map((m) => (
                <Checkbox
                  key={m.id}
                  label={`${m.name} (${m.email})`}
                  checked={people.includes(m.id)}
                  onChange={(e) =>
                    setPeople(
                      e.target.checked ? [...people, m.id] : people.filter((x) => x !== m.id),
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <p className="fc-muted">
              {query.trim() ? "Nobody matches." : "Type a name or an email to find someone."}
            </p>
          )}
        </div>
      ) : null}
      <Notice tone={empty ? "warning" : "info"}>
        {empty
          ? mode === "roles"
            ? "Pick at least one role."
            : "Pick at least one person."
          : confirmation(next, reach.length, view.members.length, branch)}
      </Notice>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

function WhoDialog({
  rule,
  members,
  branch,
  onClose,
}: {
  rule: Rule;
  members: readonly Member[];
  branch?: string;
  onClose: () => void;
}) {
  const reach = audience(asSharing(rule), members, branch);
  return (
    <Dialog
      title="Who has access"
      description={
        rule.mode === "nobody"
          ? `A draft: ${alwaysLabel(branch).toLowerCase()}.`
          : `Published to ${sharedWith(rule, members)}. Admins always have access.`
      }
      onClose={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <p className="fc-muted">{peopleCount(reach.length)}</p>
      <ul className="ft-who">
        {reach.map((m) => (
          <li key={m.id}>
            <span>
              {m.name} <span className="fc-mono fc-muted">{m.email}</span>
            </span>
            {m.roles.includes("admin") ? <Badge tone="strong">admin</Badge> : null}
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

function UnpublishDialog({
  where,
  count,
  branch,
  onClose,
  confirm,
}: {
  where: string;
  count: number;
  branch?: string;
  onClose: () => void;
  confirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <Dialog
      title={`Unpublish ${where}?`}
      description={`It goes back to a draft: ${alwaysLabel(branch).toLowerCase()}.`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await confirm();
              } catch (e) {
                setError(explain(e, "It was not unpublished. Try again."));
                setBusy(false);
              }
            }}
          >
            {busy ? "Unpublishing…" : "Unpublish"}
          </Button>
        </>
      }
    >
      <p>
        {count === 0
          ? "Nobody but admins has access now."
          : `${peopleCount(count)} other than admins will lose access at their next call. It stays in their library, and works again if you publish it to them.`}
      </p>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}
