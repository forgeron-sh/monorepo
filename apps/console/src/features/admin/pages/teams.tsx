import { Badge, Button, Dialog, EmptyState, Field, Input, Notice, Page, Table } from "@forgeron/ui";
import type { TableColumn } from "@forgeron/ui";
import { addresses } from "@forgeron/platform-contract/client";
import { useState } from "react";
import { explain, ok, typedSender, type Api } from "../../../api";
import { hrefOf } from "../../../shell/href";
import { routeClick } from "../../../router";
import { can } from "../../../shell/access";
import type { PageProps } from "../../../shell/page-props";
import { LoadError, Loading } from "../../../states";
import { byTeam, loadTeams, teamSummary, type TeamRow } from "../../../teams";
import { useLoad } from "../../../use-load";

// The workspace's teams (D-132, D-136): named groups of people, and what each may do on Forgeron. A
// team is also how a tool is shared (its Access tab names teams). Anyone signed in reads this list;
// whoever holds `teams:write` creates and changes teams, within what they hold themselves.

const slugOf = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^[^a-z]+/, "")
    .slice(0, 34);

const count = (n: number) => (n === 1 ? "1 member" : `${n} members`);

function NewTeamDialog({
  api,
  onClose,
  onCreated,
}: {
  api: Api;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const create = async () => {
    setBusy(true);
    setError(undefined);
    try {
      ok(
        await typedSender(api.sendJson)(addresses.createTeam, { json: { id, name, description } }),
      );
      onCreated(id);
    } catch (e) {
      setError(explain(e, "The team was not created. Try again."));
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="New team"
      description="A team is a group of people. Give it what it may do on Forgeron, and share tools with it in their Access tab."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void create()}
            disabled={busy || !name.trim() || !id}
          >
            {busy ? "Creating…" : "Create team"}
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
            data-autofocus
            onChange={(e) => {
              setName(e.target.value);
              if (!idTouched) setId(slugOf(e.target.value));
            }}
          />
        )}
      </Field>
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
      <Field label="Description">
        {(control) => (
          <Input
            {...control}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}

export default function TeamsPage({ api, ws, go }: PageProps) {
  const teams = useLoad(() => loadTeams(api.fetchJson), [api]);
  const [creating, setCreating] = useState(false);
  const writes = can(ws.person, "teams:write");

  const open = (t: TeamRow) => go(hrefOf("/admin/teams/:id", { id: t.id }));
  const columns: Array<TableColumn<TeamRow>> = [
    {
      key: "name",
      header: "Team",
      render: (t) => (
        <span>
          <a
            href={hrefOf("/admin/teams/:id", { id: t.id })}
            onClick={(e) => {
              e.stopPropagation();
              routeClick(go)(e);
            }}
          >
            {t.name}
          </a>{" "}
          {t.builtIn ? <Badge>Built in</Badge> : <span className="fc-mono fc-muted">{t.id}</span>}
        </span>
      ),
    },
    { key: "members", header: "Members", render: (t) => count(t.members.length) },
    {
      key: "can",
      header: "On Forgeron",
      render: (t) => <span className="fc-muted">{teamSummary(t)}</span>,
    },
  ];

  return (
    <Page
      title="Teams"
      description="Groups of people: what each may do on Forgeron, and who a tool is shared with. A person is in as many teams as they need."
      actions={
        writes ? (
          <Button variant="primary" onClick={() => setCreating(true)}>
            New team
          </Button>
        ) : undefined
      }
    >
      {teams.loading ? (
        <Loading shape="table" label="Loading teams" />
      ) : !teams.data ? (
        <LoadError what="The teams" error={teams.error} onRetry={teams.reload} />
      ) : (
        <Table
          columns={columns}
          rows={[...teams.data].sort(byTeam)}
          rowKey={(t) => t.id}
          onRowClick={open}
          empty={
            <EmptyState
              title="No team yet"
              description="Create one, then share a tool with it in the tool's Access tab."
            />
          }
        />
      )}
      {creating ? (
        <NewTeamDialog
          api={api}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            go(hrefOf("/admin/teams/:id", { id }));
          }}
        />
      ) : null}
    </Page>
  );
}
