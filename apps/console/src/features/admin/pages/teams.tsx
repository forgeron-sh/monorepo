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
import { addresses } from "@forgeron/platform-contract/client";
import { useState } from "react";
import { explain, ok, typedClient, typedSender, type Api } from "../../../api";
import { loadMembers, type MemberRow } from "../../../members";
import type { PageProps } from "../../../shell/page-props";
import { LoadError, Loading } from "../../../states";
import { useLoad } from "../../../use-load";

// The workspace's teams (D-132): named groups of members. A team is a way to give access (it appears
// in a tool's Access tab like a role) and what a tool shows of "my team". An admin creates and
// changes them; the platform refuses anyone else and audits every change.

interface TeamRow {
  id: string;
  name: string;
  description: string;
  members: string[];
  role: string;
}

export async function loadTeams(fetchJson: Api["fetchJson"]): Promise<TeamRow[]> {
  return ok(await typedClient(fetchJson)(addresses.listTeams)).teams;
}

const slugOf = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^[^a-z]+/, "")
    .slice(0, 34);

function TeamDialog({
  team,
  members,
  api,
  onClose,
  onSaved,
}: {
  /** `undefined`: a new team. */
  team?: TeamRow;
  members: MemberRow[];
  api: Api;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team?.name ?? "");
  const [id, setId] = useState(team?.id ?? "");
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState(team?.description ?? "");
  const [picked, setPicked] = useState<string[]>(team?.members ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const send = typedSender(api.sendJson);
      if (team) {
        ok(
          await send(addresses.updateTeam, {
            params: { id: team.id },
            json: { name, description, members: picked },
          }),
        );
      } else {
        ok(await send(addresses.createTeam, { json: { id, name, description, members: picked } }));
      }
      onSaved();
    } catch (e) {
      setError(explain(e, "The team was not saved. Try again."));
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      ok(await typedSender(api.sendJson)(addresses.deleteTeam, { params: { id: team!.id } }));
      onSaved();
    } catch (e) {
      setError(explain(e, "The team was not deleted. Try again."));
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Dialog
      title={team ? `Team ${team.name}` : "New team"}
      description={
        team
          ? `Its address is ${team.id}; in a tool's Access tab it is called ${team.role}.`
          : "A team is a group of the workspace's members: give it access to a tool, or let a tool show its own space."
      }
      onClose={() => !busy && onClose()}
      footer={
        <>
          {team ? (
            <Button
              variant="danger"
              onClick={() => (confirmDelete ? void remove() : setConfirmDelete(true))}
              disabled={busy}
            >
              {confirmDelete ? "Delete for good" : "Delete"}
            </Button>
          ) : null}
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void save()}
            disabled={busy || !name.trim() || (!team && !id)}
          >
            {busy ? "Saving…" : team ? "Save" : "Create team"}
          </Button>
        </>
      }
    >
      <Field label="Name">
        {(control) => (
          <Input
            {...control}
            value={name}
            placeholder="Product"
            onChange={(e) => {
              setName(e.target.value);
              if (!team && !idTouched) setId(slugOf(e.target.value));
            }}
          />
        )}
      </Field>
      {team ? null : (
        <Field label="Address" hint="Chosen once: lower case letters, digits and -.">
          {(control) => (
            <Input
              {...control}
              className="fc-mono"
              value={id}
              onChange={(e) => {
                setIdTouched(true);
                setId(e.target.value);
              }}
            />
          )}
        </Field>
      )}
      <Field label="Description">
        {(control) => (
          <Input
            {...control}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>
      <fieldset className="fc-fieldset">
        <legend className="fc-legend">Members</legend>
        <div className="fc-checks">
          {members.map((m) => (
            <Checkbox
              key={m.id}
              label={`${m.name} (${m.email})`}
              checked={picked.includes(m.id)}
              onChange={(e) =>
                setPicked(e.target.checked ? [...picked, m.id] : picked.filter((x) => x !== m.id))
              }
            />
          ))}
        </div>
      </fieldset>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

export default function TeamsPage({ api }: PageProps) {
  const teams = useLoad(() => loadTeams(api.fetchJson), [api]);
  const members = useLoad(() => loadMembers(api.fetchJson), [api]);
  const [editing, setEditing] = useState<TeamRow | "new">();

  const people = members.data?.members ?? [];
  const columns: Array<TableColumn<TeamRow>> = [
    {
      key: "name",
      header: "Team",
      render: (t) => (
        <span>
          {t.name} <span className="fc-mono fc-muted">{t.id}</span>
        </span>
      ),
    },
    {
      key: "members",
      header: "Members",
      render: (t) => (
        <span className="fc-badges">
          {t.members.length === 0 ? <span className="fc-muted">Nobody yet</span> : null}
          {t.members.slice(0, 5).map((id) => (
            <Badge key={id}>{people.find((m) => m.id === id)?.name ?? id}</Badge>
          ))}
          {t.members.length > 5 ? <Badge>+{t.members.length - 5}</Badge> : null}
        </span>
      ),
    },
  ];

  return (
    <Page
      title="Teams"
      description="Groups of members: give a team access to a tool, or let a tool show a team's own space."
      actions={
        <Button variant="primary" onClick={() => setEditing("new")} disabled={!members.data}>
          New team
        </Button>
      }
    >
      {teams.loading || members.loading ? (
        <Loading shape="table" label="Loading teams" />
      ) : !teams.data || !members.data ? (
        <LoadError what="The teams" error={teams.error ?? members.error} onRetry={teams.reload} />
      ) : (
        <Table
          columns={columns}
          rows={teams.data}
          rowKey={(t) => t.id}
          onRowClick={(t) => setEditing(t)}
          empty={
            <EmptyState
              title="No team yet"
              description="Create one, then give it access to a tool in the tool's Access tab."
            />
          }
        />
      )}
      {editing && members.data ? (
        <TeamDialog
          {...(editing === "new" ? {} : { team: editing })}
          members={members.data.members}
          api={api}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            teams.reload();
          }}
        />
      ) : null}
    </Page>
  );
}
