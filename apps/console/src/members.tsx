import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  Notice,
  Page,
  Table,
  type TableColumn,
} from "@forgeron/ui";
import { ADMIN_TEAM } from "@forgeron/permissions";
import { useState } from "react";
import { addresses } from "@forgeron/platform-contract/client";
import { explain, ok, typedClient, typedSender, type Api, type SendJson } from "./api";
import { expiry } from "./format";
import { can } from "./shell/access";
import { Loading, LoadError } from "./states";
import { TeamPicker } from "./team-picker";
import { loadTeams, type TeamRow } from "./teams";
import { useLoad } from "./use-load";
import type { WorkspaceInfo } from "./workspace";

// The people of the workspace and how they get in (D-049, D-137): who is a member and in which teams,
// who is invited, and which email domains join by themselves. The platform checks the permission
// of whoever asks (and that they hold what a team gives) and audits every change; this screen only
// draws what it answers.

export interface MemberRow {
  id: string;
  email: string;
  name: string;
  /** The ids of its teams. */
  teams: string[];
}

export interface InvitationRow {
  email: string;
  teams: string[];
  expiresAt: string;
}

export interface MembershipView {
  members: MemberRow[];
  invitations: InvitationRow[];
  domains: string[];
  /** The teams a person who joins by domain is put in. */
  defaultTeams: string[];
  /** `console` once someone saved the domains, `install` while they are the install's. */
  source: string;
}

type Send = SendJson;

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** Asks the platform for the members, invitations and settings. Only what the screen draws is kept. */
export async function loadMembers(
  fetchJson: (path: string) => Promise<unknown>,
): Promise<MembershipView> {
  const body = ok(await typedClient(fetchJson)(addresses.listMembers));
  return {
    members: (body.members ?? []).map((m) => ({
      id: String(m.id),
      email: String(m.email),
      name: String(m.name),
      teams: strings(m.teams),
    })),
    invitations: (body.invitations ?? []).map((i) => ({
      email: String(i.email),
      teams: strings(i.teams),
      expiresAt: String(i.expiresAt),
    })),
    domains: strings(body.settings?.domains),
    defaultTeams: strings(body.settings?.defaultTeams),
    source: String(body.settings?.source ?? "install"),
  };
}

/** `a, b` → `["a", "b"]`: domains are typed as a comma-separated list. */
export const parseList = (text: string): string[] =>
  text
    .split(/[,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

const inviteMember = async (send: Send, email: string, teams: string[]) =>
  ok(await typedSender(send)(addresses.inviteMember, { json: { email, teams } }));
const changeTeams = async (send: Send, id: string, teams: string[]) =>
  ok(await typedSender(send)(addresses.setMemberTeams, { params: { id }, json: { teams } }));
const removeMember = async (send: Send, id: string) =>
  ok(await typedSender(send)(addresses.removeMember, { params: { id } }));
const withdrawInvitation = async (send: Send, email: string) =>
  ok(await typedSender(send)(addresses.withdrawInvitation, { params: { email } }));
const saveDomains = async (send: Send, domains: string[], defaultTeams: string[]) =>
  ok(
    await typedSender(send)(addresses.putMembershipSettings, {
      json: { domains, defaultTeams },
    }),
  );

export interface MembersProps {
  view: MembershipView;
  /** Whose row is "you": the caller's own id. */
  selfId?: string;
  now: Date;
  /** The workspace's teams, to name the chips. */
  teams?: readonly TeamRow[];
  /** Called with a member to edit or remove; the screen only draws the buttons when given. */
  onEditTeams?: (member: MemberRow) => void;
  onRemove?: (member: MemberRow) => void;
  onWithdraw?: (invitation: InvitationRow) => void;
  onInvite?: () => void;
}

export function Members({
  view,
  selfId,
  now,
  teams = [],
  onEditTeams,
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
      key: "teams",
      header: "Teams",
      render: (m) => <TeamChips ids={m.teams} teams={teams} />,
    },
    {
      key: "status",
      header: "Status",
      render: () => (
        <Badge tone="success" dot>
          Active
        </Badge>
      ),
    },
    ...(onEditTeams || onRemove
      ? [
          {
            key: "actions",
            header: "",
            render: (m: MemberRow) => (
              <div className="fc-cell-actions">
                {onEditTeams ? (
                  <Button variant="ghost" size="sm" onClick={() => onEditTeams(m)}>
                    Change teams
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
      key: "teams",
      header: "Teams",
      render: (i) => <TeamChips ids={i.teams} teams={teams} />,
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

/** The teams of a person as chips: the admin team is the strong one; none is said, not hidden. */
export function TeamChips({ ids, teams }: { ids: readonly string[]; teams: readonly TeamRow[] }) {
  if (ids.length === 0) return <span className="fc-muted">No team</span>;
  return (
    <span className="fc-badges">
      {ids.map((id) => (
        <Badge key={id} tone={id === ADMIN_TEAM ? "strong" : "neutral"}>
          {teams.find((t) => t.id === id)?.name ?? id}
        </Badge>
      ))}
    </span>
  );
}

type Asking =
  | { kind: "invite" }
  | { kind: "teams"; member: MemberRow }
  | { kind: "remove"; member: MemberRow };

/** The members screen: the lists, the invite and teams dialogs. Changes need `members:write`. */
export function MembersPage({
  api,
  person,
  now,
  inviteOnOpen = false,
}: {
  api: Api;
  /** Who looks: their id is "you", their permissions say what they may change. */
  person: WorkspaceInfo["person"];
  now: () => Date;
  /** Opens the invite dialog as the screen opens ("Invite people" in the workspace menu). */
  inviteOnOpen?: boolean;
}) {
  const loaded = useLoad(() => loadMembers(api.fetchJson), [api]);
  const teamList = useLoad(() => loadTeams(api.fetchJson), [api]);
  const writes = can(person, "members:write");
  const [asking, setAsking] = useState<Asking | undefined>(
    inviteOnOpen && writes ? { kind: "invite" } : undefined,
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
  const teams = teamList.data ?? [];
  return (
    <Page
      title="Members"
      description="Who can sign in to this workspace, and the teams they are in. What a team may do is set in Teams."
      actions={
        view && writes ? (
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
        <Loading shape="table" label="Loading members" />
      ) : loaded.error && !view ? (
        <LoadError what="The members" error={loaded.error} onRetry={loaded.reload} />
      ) : view ? (
        <>
          <Members
            view={view}
            selfId={person.id}
            now={now()}
            teams={teams}
            {...(writes
              ? {
                  onInvite: () => setAsking({ kind: "invite" }),
                  onEditTeams: (member: MemberRow) => setAsking({ kind: "teams", member }),
                  onRemove: (member: MemberRow) => setAsking({ kind: "remove", member }),
                  onWithdraw: (i: InvitationRow) =>
                    void run(
                      () => withdrawInvitation(api.sendJson, i.email),
                      `Invitation to ${i.email} withdrawn.`,
                    ),
                }
              : {})}
          />
          {asking?.kind === "invite" ? (
            <InviteDialog
              teams={teams}
              actor={person.permissions}
              onClose={() => setAsking(undefined)}
              send={async (email, picked) => {
                const answer = (await inviteMember(api.sendJson, email, picked)) as
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
          {asking?.kind === "teams" ? (
            <TeamsDialog
              member={asking.member}
              teams={teams}
              actor={person.permissions}
              onClose={() => setAsking(undefined)}
              send={async (picked) => {
                await changeTeams(api.sendJson, asking.member.id, picked);
                setAsking(undefined);
                setNotice({ tone: "success", text: `Teams of ${asking.member.email} saved.` });
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
  teams,
  actor,
  onClose,
  send,
}: {
  teams: readonly TeamRow[];
  actor: WorkspaceInfo["person"]["permissions"];
  onClose: () => void;
  send: (email: string, teams: string[]) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [bad, setBad] = useState<string>();
  const { busy, error, submit } = useSubmit(() => send(email.trim(), picked));
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
      <TeamPicker
        teams={teams}
        value={picked}
        onChange={setPicked}
        actor={actor}
        legend="Teams they join"
        hint="None by default: they use the tools given to everyone."
      />
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

function TeamsDialog({
  member,
  teams,
  actor,
  onClose,
  send,
}: {
  member: MemberRow;
  teams: readonly TeamRow[];
  actor: WorkspaceInfo["person"]["permissions"];
  onClose: () => void;
  send: (teams: string[]) => Promise<unknown>;
}) {
  const [picked, setPicked] = useState(member.teams);
  const { busy, error, submit } = useSubmit(() => send(picked));
  return (
    <Dialog
      title={`Change teams of ${member.email}`}
      description="What a person may do is read at every call: the change applies at once."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy} onClick={() => void submit()}>
            Save teams
          </Button>
        </>
      }
    >
      <TeamPicker teams={teams} value={picked} onChange={setPicked} actor={actor} />
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
  teams,
  actor,
  readOnly = false,
  api,
  onSaved,
}: {
  view: MembershipView;
  teams: readonly TeamRow[];
  actor: WorkspaceInfo["person"]["permissions"];
  /** Without `members:write`: shown, not changed. */
  readOnly?: boolean;
  api: Api;
  onSaved: () => void;
}) {
  const [domains, setDomains] = useState(view.domains.join(", "));
  const [defaultTeams, setDefaultTeams] = useState(view.defaultTeams);
  const [saved, setSaved] = useState(false);
  const { busy, error, submit } = useSubmit(async () => {
    await saveDomains(api.sendJson, parseList(domains), defaultTeams);
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
                disabled={readOnly}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="acme.fr"
              />
            )}
          </Field>
        </div>
        <TeamPicker
          teams={teams}
          value={defaultTeams}
          onChange={setDefaultTeams}
          actor={actor}
          legend="Join with teams"
          hint="The teams people who join this way are put in. None by default. Never Admins."
          hide={[ADMIN_TEAM]}
          disabled={readOnly}
        />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {saved && !error ? (
          <Notice tone="success">Saved. It applies from the next sign-in.</Notice>
        ) : null}
        <div className="fc-form-actions">
          <Button type="submit" variant="primary" disabled={busy || readOnly}>
            Save domains
          </Button>
        </div>
      </form>
    </section>
  );
}

/** Who joins by themselves: the allowed email domains and the teams they join with. */
export function DomainsPage({ api, person }: { api: Api; person: WorkspaceInfo["person"] }) {
  const loaded = useLoad(() => loadMembers(api.fetchJson), [api]);
  const teams = useLoad(() => loadTeams(api.fetchJson), [api]);
  const view = loaded.data;
  return (
    <Page title="Domains" description="Email domains whose people join this workspace on sign-in.">
      {loaded.loading || teams.loading ? (
        <Loading shape="list" label="Loading domains" />
      ) : loaded.error && !view ? (
        <LoadError what="The domains" error={loaded.error} onRetry={loaded.reload} />
      ) : view ? (
        <DomainsForm
          key={view.domains.join(",") + view.defaultTeams.join(",")}
          view={view}
          teams={teams.data ?? []}
          actor={person.permissions}
          readOnly={!can(person, "members:write")}
          api={api}
          onSaved={loaded.reload}
        />
      ) : null}
    </Page>
  );
}
