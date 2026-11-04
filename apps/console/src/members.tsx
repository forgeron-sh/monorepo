import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  EmptyState,
  Field,
  Input,
  Notice,
  Page,
  Table,
  type TableColumn,
} from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api, type SendJson } from "./api";
import { expiry } from "./format";
import { Loading, LoadError } from "./states";
import { useLoad } from "./use-load";

// The people of the workspace and how they get in (D-049): who is a member and with which roles,
// who is invited, and which email domains join by themselves. The platform refuses anyone but an
// admin and audits every change; this screen only draws what it answers.

export interface MemberRow {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface InvitationRow {
  email: string;
  roles: string[];
  expiresAt: string;
}

export interface MembershipView {
  members: MemberRow[];
  invitations: InvitationRow[];
  domains: string[];
  defaultRole: string;
  /** `console` once an admin saved the domains, `install` while they are the install's. */
  source: string;
}

type Send = SendJson;

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** Asks the platform for the members, invitations and settings. Only what the screen draws is kept. */
export async function loadMembers(
  fetchJson: (path: string) => Promise<unknown>,
): Promise<MembershipView> {
  const body = (await fetchJson("/api/members")) as {
    members?: Array<{ id?: unknown; email?: unknown; name?: unknown; roles?: unknown }>;
    invitations?: Array<{ email?: unknown; roles?: unknown; expiresAt?: unknown }>;
    settings?: { domains?: unknown; defaultRole?: unknown; source?: unknown };
  };
  return {
    members: (body.members ?? []).map((m) => ({
      id: String(m.id),
      email: String(m.email),
      name: String(m.name),
      roles: strings(m.roles),
    })),
    invitations: (body.invitations ?? []).map((i) => ({
      email: String(i.email),
      roles: strings(i.roles),
      expiresAt: String(i.expiresAt),
    })),
    domains: strings(body.settings?.domains),
    defaultRole: typeof body.settings?.defaultRole === "string" ? body.settings.defaultRole : "",
    source: String(body.settings?.source ?? "install"),
  };
}

/** `a, b` → `["a", "b"]`: roles and domains are typed as a comma-separated list. */
export const parseList = (text: string): string[] =>
  text
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

const inviteMember = (send: Send, email: string, roles: string[]) =>
  send("/api/invitations", { email, roles }, "POST");
const changeRoles = (send: Send, id: string, roles: string[]) =>
  send(`/api/members/${id}`, { roles }, "PATCH");
const removeMember = (send: Send, id: string) => send(`/api/members/${id}`, undefined, "DELETE");
const withdrawInvitation = (send: Send, email: string) =>
  send(`/api/invitations/${encodeURIComponent(email)}`, undefined, "DELETE");
const saveDomains = (send: Send, domains: string[], defaultRole: string) =>
  send("/api/membership-settings", { domains, defaultRole: defaultRole || null }, "PUT");

export interface MembersProps {
  view: MembershipView;
  /** Whose row is "you": the caller's own id. */
  selfId?: string;
  now: Date;
  /** Called with a member to edit or remove; the screen only draws the buttons when given. */
  onEditRoles?: (member: MemberRow) => void;
  onRemove?: (member: MemberRow) => void;
  onWithdraw?: (invitation: InvitationRow) => void;
  onInvite?: () => void;
}

export function Members({
  view,
  selfId,
  now,
  onEditRoles,
  onRemove,
  onWithdraw,
  onInvite,
}: MembersProps) {
  const members: Array<TableColumn<MemberRow>> = [
    {
      key: "email",
      header: "Member",
      render: (m) => (
        <span>
          <span className="fc-mono">{m.email}</span>
          {m.id === selfId ? (
            <>
              {" "}
              <Badge>You</Badge>
            </>
          ) : null}
        </span>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      render: (m) => (
        <span className="fc-badges">
          {m.roles.length ? (
            m.roles.map((r) => (
              <Badge key={r} tone={r === "admin" ? "strong" : "neutral"}>
                {r}
              </Badge>
            ))
          ) : (
            <span className="fc-muted">None</span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m) =>
        m.roles.length ? (
          <Badge tone="success" dot>
            Active
          </Badge>
        ) : (
          <Badge tone="warning" dot>
            No role
          </Badge>
        ),
    },
    ...(onEditRoles || onRemove
      ? [
          {
            key: "actions",
            header: "",
            render: (m: MemberRow) => (
              <div className="fc-cell-actions">
                {onEditRoles ? (
                  <Button variant="ghost" size="sm" onClick={() => onEditRoles(m)}>
                    Change roles
                  </Button>
                ) : null}
                {onRemove ? (
                  <Button variant="danger" size="sm" onClick={() => onRemove(m)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ];
  const invitations: Array<TableColumn<InvitationRow>> = [
    { key: "email", header: "Invited", mono: true },
    {
      key: "roles",
      header: "Roles",
      render: (i) => (
        <span className="fc-badges">
          {i.roles.length ? (
            i.roles.map((r) => <Badge key={r}>{r}</Badge>)
          ) : (
            <span className="fc-muted">None</span>
          )}
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Status",
      render: (i) => {
        const left = expiry(i.expiresAt, now);
        return (
          <span className="fc-badges">
            <Badge tone={left.expired ? "danger" : "warning"} dot>
              {left.expired ? "Expired" : "Pending"}
            </Badge>
            {left.expired ? null : <span className="fc-muted">{left.text}</span>}
          </span>
        );
      },
    },
    ...(onWithdraw
      ? [
          {
            key: "actions",
            header: "",
            render: (i: InvitationRow) => (
              <div className="fc-cell-actions">
                <Button variant="ghost" size="sm" onClick={() => onWithdraw(i)}>
                  Withdraw
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];
  return (
    <>
      <section className="fc-section" aria-labelledby="members-title">
        <div className="fc-section-head">
          <h2 id="members-title" className="fc-section-title">
            Current members
          </h2>
        </div>
        <Table columns={members} rows={view.members} rowKey={(m) => m.id} empty="No member yet." />
      </section>
      <section className="fc-section" aria-labelledby="invitations-title">
        <div className="fc-section-head">
          <h2 id="invitations-title" className="fc-section-title">
            Pending invitations
          </h2>
        </div>
        {view.invitations.length === 0 ? (
          <EmptyState
            title="No pending invitation"
            description="Invite someone by email. They join the first time they sign in with that address."
            action={
              onInvite ? (
                <Button variant="primary" onClick={onInvite}>
                  Invite people
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table columns={invitations} rows={view.invitations} rowKey={(i) => i.email} />
        )}
      </section>
    </>
  );
}

/** Roles every workspace has; the ones its people already hold come on top. */
const BASE_ROLES = ["admin", "developer"];
export const knownRoles = (view: MembershipView): string[] => [
  ...new Set([
    ...BASE_ROLES,
    ...view.members.flatMap((m) => m.roles),
    ...view.invitations.flatMap((i) => i.roles),
    ...(view.defaultRole ? [view.defaultRole] : []),
  ]),
];

/** A checkbox per known role, and a field for the others. */
function RolePicker({
  known,
  value,
  extra,
  onChange,
  onExtra,
}: {
  known: string[];
  value: string[];
  extra: string;
  onChange: (roles: string[]) => void;
  onExtra: (text: string) => void;
}) {
  return (
    <>
      <fieldset className="fc-fieldset">
        <legend className="fc-legend">Roles</legend>
        <div className="fc-roles">
          {known.map((role) => (
            <Checkbox
              key={role}
              label={role}
              checked={value.includes(role)}
              onChange={(e) =>
                onChange(e.target.checked ? [...value, role] : value.filter((r) => r !== role))
              }
            />
          ))}
        </div>
      </fieldset>
      <Field label="Other roles" hint="Role names from your tools, separated by commas.">
        {(control) => (
          <Input
            {...control}
            mono
            value={extra}
            onChange={(e) => onExtra(e.target.value)}
            placeholder="viewer"
          />
        )}
      </Field>
    </>
  );
}

type Asking =
  | { kind: "invite" }
  | { kind: "roles"; member: MemberRow }
  | { kind: "remove"; member: MemberRow };

/** The members screen: the lists, the invite and role dialogs, and who joins by themselves. For an admin. */
export function MembersPage({
  api,
  selfId,
  now,
  inviteOnOpen = false,
}: {
  api: Api;
  selfId?: string;
  now: () => Date;
  /** Opens the invite dialog as the screen opens ("Invite people" in the workspace menu). */
  inviteOnOpen?: boolean;
}) {
  const loaded = useLoad(() => loadMembers(api.fetchJson), [api]);
  const [asking, setAsking] = useState<Asking | undefined>(
    inviteOnOpen ? { kind: "invite" } : undefined,
  );
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "danger"; text: string }>();

  const run = async (work: () => Promise<unknown>, done: string) => {
    setNotice(undefined);
    try {
      await work();
      setNotice({ tone: "success", text: done });
    } catch (e) {
      setNotice({ tone: "danger", text: explain(e, "The change was not saved. Try again.") });
    }
    loaded.reload();
  };

  const view = loaded.data;
  return (
    <Page
      title="Members"
      description="Who can sign in to this workspace, and with which roles."
      actions={
        view ? (
          <Button variant="primary" onClick={() => setAsking({ kind: "invite" })}>
            Invite people
          </Button>
        ) : undefined
      }
    >
      {notice ? (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      ) : null}
      {loaded.loading ? (
        <Loading label="Loading members" />
      ) : loaded.error && !view ? (
        <LoadError what="The members" error={loaded.error} onRetry={loaded.reload} />
      ) : view ? (
        <>
          <Members
            view={view}
            {...(selfId ? { selfId } : {})}
            now={now()}
            onInvite={() => setAsking({ kind: "invite" })}
            onEditRoles={(member) => setAsking({ kind: "roles", member })}
            onRemove={(member) => setAsking({ kind: "remove", member })}
            onWithdraw={(i) =>
              void run(
                () => withdrawInvitation(api.sendJson, i.email),
                `Invitation to ${i.email} withdrawn.`,
              )
            }
          />
          {asking?.kind === "invite" ? (
            <InviteDialog
              known={knownRoles(view)}
              onClose={() => setAsking(undefined)}
              send={async (email, roles) => {
                const answer = (await inviteMember(api.sendJson, email, roles)) as
                  | { notified?: boolean }
                  | undefined;
                setAsking(undefined);
                setNotice(
                  answer?.notified === false
                    ? {
                        tone: "warning",
                        text: `${email} is invited, but the email could not be sent. Tell them to sign in at the workspace address.`,
                      }
                    : { tone: "success", text: `Invitation sent to ${email}.` },
                );
                loaded.reload();
              }}
            />
          ) : null}
          {asking?.kind === "roles" ? (
            <RolesDialog
              member={asking.member}
              known={knownRoles(view)}
              onClose={() => setAsking(undefined)}
              send={async (roles) => {
                await changeRoles(api.sendJson, asking.member.id, roles);
                setAsking(undefined);
                setNotice({ tone: "success", text: `Roles of ${asking.member.email} saved.` });
                loaded.reload();
              }}
            />
          ) : null}
          {asking?.kind === "remove" ? (
            <RemoveDialog
              member={asking.member}
              onClose={() => setAsking(undefined)}
              send={async () => {
                await removeMember(api.sendJson, asking.member.id);
                setAsking(undefined);
                setNotice({ tone: "success", text: `${asking.member.email} removed.` });
                loaded.reload();
              }}
            />
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

/** What a dialog's confirm button does: runs it, keeps the dialog open with the reason when it fails. */
function useSubmit(send: () => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await send();
    } catch (e) {
      setError(explain(e, "The change was not saved. Try again."));
    }
    setBusy(false);
  };
  return { busy, error, submit };
}

function InviteDialog({
  known,
  onClose,
  send,
}: {
  known: string[];
  onClose: () => void;
  send: (email: string, roles: string[]) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [extra, setExtra] = useState("");
  const [bad, setBad] = useState<string>();
  const { busy, error, submit } = useSubmit(() =>
    send(email.trim(), [...new Set([...roles, ...parseList(extra)])]),
  );
  return (
    <Dialog
      title="Invite people"
      description="They get an email and join the first time they sign in with that address."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                setBad("This is not an email address. Check it and try again.");
                return;
              }
              setBad(undefined);
              void submit();
            }}
          >
            Send invitation
          </Button>
        </>
      }
    >
      <Field label="Email address" {...(bad ? { error: bad } : {})}>
        {(control) => (
          <Input
            {...control}
            type="email"
            data-autofocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@acme.fr"
          />
        )}
      </Field>
      <RolePicker
        known={known}
        value={roles}
        extra={extra}
        onChange={setRoles}
        onExtra={setExtra}
      />
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

function RolesDialog({
  member,
  known,
  onClose,
  send,
}: {
  member: MemberRow;
  known: string[];
  onClose: () => void;
  send: (roles: string[]) => Promise<unknown>;
}) {
  const [roles, setRoles] = useState(member.roles.filter((r) => known.includes(r)));
  const [extra, setExtra] = useState("");
  const { busy, error, submit } = useSubmit(() =>
    send([...new Set([...roles, ...parseList(extra)])]),
  );
  return (
    <Dialog
      title={`Change roles of ${member.email}`}
      description="Roles are read at every call: the change applies at once."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy} onClick={() => void submit()}>
            Save roles
          </Button>
        </>
      }
    >
      <RolePicker
        known={known}
        value={roles}
        extra={extra}
        onChange={setRoles}
        onExtra={setExtra}
      />
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

function RemoveDialog({
  member,
  onClose,
  send,
}: {
  member: MemberRow;
  onClose: () => void;
  send: () => Promise<unknown>;
}) {
  const { busy, error, submit } = useSubmit(send);
  return (
    <Dialog
      title={`Remove ${member.email}?`}
      description="Their sessions stop at once. They can come back only if you invite them again, or if their email domain joins by itself."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => void submit()}>
            Remove member
          </Button>
        </>
      }
    >
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

export function DomainsForm({
  view,
  api,
  onSaved,
}: {
  view: MembershipView;
  api: Api;
  onSaved: () => void;
}) {
  const [domains, setDomains] = useState(view.domains.join(", "));
  const [defaultRole, setDefaultRole] = useState(view.defaultRole);
  const [saved, setSaved] = useState(false);
  const { busy, error, submit } = useSubmit(async () => {
    await saveDomains(api.sendJson, parseList(domains), defaultRole.trim());
    setSaved(true);
    onSaved();
  });
  return (
    <section className="fc-section" aria-labelledby="domains-title">
      <div className="fc-section-head">
        <h2 id="domains-title" className="fc-section-title">
          Who joins by themselves
        </h2>
      </div>
      <p className="fc-section-hint">
        People with an email at one of these domains join the workspace when they sign in
        {view.source === "install"
          ? ". These come from the install; saving here replaces them"
          : ""}
        .
      </p>
      <form
        className="fc-panel fc-stack"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(false);
          void submit();
        }}
      >
        <div className="fc-row">
          <Field label="Email domains" hint="Separated by commas. Leave empty to turn it off.">
            {(control) => (
              <Input
                {...control}
                mono
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="acme.fr"
              />
            )}
          </Field>
          <Field label="Default role" hint="Given to people who join this way. Never admin.">
            {(control) => (
              <Input
                {...control}
                mono
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                placeholder="none"
              />
            )}
          </Field>
        </div>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {saved && !error ? (
          <Notice tone="success">Saved. It applies from the next sign-in.</Notice>
        ) : null}
        <div className="fc-form-actions">
          <Button type="submit" variant="primary" disabled={busy}>
            Save domains
          </Button>
        </div>
      </form>
    </section>
  );
}

/** Who joins by themselves: the allowed email domains and the role they get. For an admin. */
export function DomainsPage({ api }: { api: Api }) {
  const loaded = useLoad(() => loadMembers(api.fetchJson), [api]);
  const view = loaded.data;
  return (
    <Page title="Domains" description="Email domains whose people join this workspace on sign-in.">
      {loaded.loading ? (
        <Loading label="Loading domains" />
      ) : loaded.error && !view ? (
        <LoadError what="The domains" error={loaded.error} onRetry={loaded.reload} />
      ) : view ? (
        <DomainsForm
          key={view.domains.join(",") + view.defaultRole}
          view={view}
          api={api}
          onSaved={loaded.reload}
        />
      ) : null}
    </Page>
  );
}
