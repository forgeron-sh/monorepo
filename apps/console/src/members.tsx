import { Badge, Button, Table, type TableColumn } from "@forgeron/ui";
import { useEffect, useState } from "react";

// The people of the workspace and how they get in (D-048): who is a member and with which roles,
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

type Send = (
  path: string,
  body: unknown,
  method?: "PUT" | "POST" | "PATCH" | "DELETE",
) => Promise<unknown>;

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
  /** Called with a member to edit or remove; the screen only draws the buttons when given. */
  onEditRoles?: (member: MemberRow) => void;
  onRemove?: (member: MemberRow) => void;
  onWithdraw?: (invitation: InvitationRow) => void;
}

export function Members({ view, onEditRoles, onRemove, onWithdraw }: MembersProps) {
  const members: Array<TableColumn<MemberRow>> = [
    { key: "email", header: "Email", mono: true },
    {
      key: "roles",
      header: "Roles",
      render: (m) =>
        m.roles.length ? (
          m.roles.map((r) => <Badge key={r}>{r}</Badge>)
        ) : (
          <Badge tone="neutral">no role</Badge>
        ),
    },
    ...(onEditRoles || onRemove
      ? [
          {
            key: "actions",
            header: "",
            render: (m: MemberRow) => (
              <>
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
              </>
            ),
          },
        ]
      : []),
  ];
  const invitations: Array<TableColumn<InvitationRow>> = [
    { key: "email", header: "Invited", mono: true },
    { key: "roles", header: "Roles", render: (i) => i.roles.join(", ") || "no role" },
    { key: "expiresAt", header: "Until", render: (i) => i.expiresAt.slice(0, 10) },
    ...(onWithdraw
      ? [
          {
            key: "actions",
            header: "",
            render: (i: InvitationRow) => (
              <Button variant="ghost" size="sm" onClick={() => onWithdraw(i)}>
                Withdraw
              </Button>
            ),
          },
        ]
      : []),
  ];
  return (
    <>
      <Table columns={members} rows={view.members} rowKey={(m) => m.id} empty="No member yet." />
      <h3>Invitations</h3>
      <Table
        columns={invitations}
        rows={view.invitations}
        rowKey={(i) => i.email}
        empty="No pending invitation."
      />
    </>
  );
}

/** The members screen with its forms: for an admin (the platform refuses anyone else). */
export function MembersEditor({
  fetchJson,
  sendJson,
}: {
  fetchJson: (path: string) => Promise<unknown>;
  sendJson: Send;
}) {
  const [view, setView] = useState<MembershipView>();
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState("");
  const [domains, setDomains] = useState("");
  const [defaultRole, setDefaultRole] = useState("");

  useEffect(() => {
    let live = true;
    loadMembers(fetchJson).then(
      (loaded) => {
        if (!live) return;
        setView(loaded);
        setDomains(loaded.domains.join(", "));
        setDefaultRole(loaded.defaultRole);
      },
      (e: unknown) => live && setError(e instanceof Error ? e.message : "Could not load."),
    );
    return () => {
      live = false;
    };
  }, [fetchJson, reload]);

  const run = async (work: () => Promise<unknown>) => {
    setError(undefined);
    try {
      await work();
      setReload((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The change was refused.");
    }
  };

  if (!view) return error ? <p role="alert">{error}</p> : <p>Loading…</p>;
  return (
    <>
      {error ? <p role="alert">{error}</p> : null}
      <Members
        view={view}
        onEditRoles={(m) => {
          const next = window.prompt(`Roles of ${m.email} (comma-separated)`, m.roles.join(", "));
          if (next !== null) void run(() => changeRoles(sendJson, m.id, parseList(next)));
        }}
        onRemove={(m) => {
          if (window.confirm(`Remove ${m.email}? Their sessions stop at once.`)) {
            void run(() => removeMember(sendJson, m.id));
          }
        }}
        onWithdraw={(i) => void run(() => withdrawInvitation(sendJson, i.email))}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await inviteMember(sendJson, email.trim(), parseList(roles));
            setEmail("");
            setRoles("");
          });
        }}
      >
        <h3>Invite</h3>
        <label>
          Email{" "}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>{" "}
        <label>
          Roles{" "}
          <input value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="developer" />
        </label>{" "}
        <Button type="submit" variant="primary">
          Invite
        </Button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(() => saveDomains(sendJson, parseList(domains), defaultRole.trim()));
        }}
      >
        <h3>Who joins by themselves</h3>
        <p>
          People with an email at one of these domains join the workspace when they sign in
          {view.source === "install" ? " (set at install; saving here replaces them)" : ""}.
        </p>
        <label>
          Domains{" "}
          <input
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="acme.fr"
          />
        </label>{" "}
        <label>
          Role{" "}
          <input
            value={defaultRole}
            onChange={(e) => setDefaultRole(e.target.value)}
            placeholder="none"
          />
        </label>{" "}
        <Button type="submit">Save</Button>
      </form>
    </>
  );
}
