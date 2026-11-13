import { Button, Checkbox, Field, Input, Notice, Page } from "@forgeron/ui";
import { addresses } from "@forgeron/platform-contract/client";
import { storedPlatformGrants, type PlatformPermission } from "@forgeron/permissions";
import { useState } from "react";
import { explain, ok, typedSender, type Api } from "../../../api";
import { loadMembers, type MemberRow } from "../../../members";
import { pathOf, routeClick } from "../../../router";
import { can } from "../../../shell/access";
import type { PageProps } from "../../../shell/page-props";
import { LoadError, Loading } from "../../../states";
import {
  loadPermissionCatalog,
  loadTeams,
  teamSummary,
  type PermissionGroup,
  type TeamRow,
} from "../../../teams";
import { useLoad } from "../../../use-load";
import { explicitOf, TeamPermissions } from "../team-permissions";

// One team (D-136): its name, who is in it, and what it may do on Forgeron. Read by anyone signed
// in; changed by whoever holds `teams:write`, within what they hold themselves (the platform checks
// it again). The tools a team uses are in each tool's Access tab: there is no cheap list of them.

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join("\0") === [...b].sort().join("\0");

function TeamEditor({
  team,
  groups,
  people,
  api,
  actor,
  writes,
  onSaved,
  onDeleted,
}: {
  team: TeamRow;
  groups: PermissionGroup[];
  /** `undefined`: the person may not list members (they see a count). */
  people?: MemberRow[];
  api: Api;
  actor: readonly PlatformPermission[];
  writes: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const everything = team.locked || team.permissions.includes("*");
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description);
  const [members, setMembers] = useState(team.members);
  const [granted, setGranted] = useState<Set<PlatformPermission>>(explicitOf(team.permissions));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stored = storedPlatformGrants(granted);
  const dirty =
    name !== team.name ||
    description !== team.description ||
    !same(members, team.members) ||
    (!everything && !same(stored, team.permissions));

  const save = async () => {
    setBusy(true);
    setError(undefined);
    setSaved(false);
    try {
      ok(
        await typedSender(api.sendJson)(addresses.updateTeam, {
          params: { id: team.id },
          json: {
            name,
            description,
            ...(people ? { members } : {}),
            ...(everything ? {} : { permissions: stored }),
          },
        }),
      );
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(explain(e, "The team was not saved. Try again."));
    }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try {
      ok(await typedSender(api.sendJson)(addresses.deleteTeam, { params: { id: team.id } }));
      onDeleted();
    } catch (e) {
      setError(explain(e, "The team was not deleted. Try again."));
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fc-stack">
      {!writes ? (
        <Notice tone="info">
          You can see this team. Changing teams needs the permission &quot;Manage teams&quot;: ask
          someone who manages teams.
        </Notice>
      ) : null}
      <section className="fc-section" aria-labelledby="team-details">
        <div className="fc-section-head">
          <h2 id="team-details" className="fc-section-title">
            Details
          </h2>
        </div>
        <div className="fc-panel fc-stack">
          <div className="fc-row">
            <Field label="Name">
              {(control) => (
                <Input
                  {...control}
                  value={name}
                  disabled={!writes}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
            <Field label="Description">
              {(control) => (
                <Input
                  {...control}
                  value={description}
                  disabled={!writes}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}
            </Field>
          </div>
          <p className="fc-muted">
            Its address is <code>{team.id}</code>. {teamSummary(team)} on Forgeron.
          </p>
        </div>
      </section>
      <section className="fc-section" aria-labelledby="team-members">
        <div className="fc-section-head">
          <h2 id="team-members" className="fc-section-title">
            Members
          </h2>
        </div>
        {people ? (
          <div className="fc-panel">
            <div className="fc-checks fc-checks-flat">
              {people.map((m) => (
                <Checkbox
                  key={m.id}
                  label={`${m.name} (${m.email})`}
                  checked={members.includes(m.id)}
                  disabled={!writes}
                  onChange={(e) =>
                    setMembers(
                      e.target.checked ? [...members, m.id] : members.filter((x) => x !== m.id),
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="fc-muted">
            {team.members.length === 1 ? "1 member" : `${team.members.length} members`}. Seeing who
            they are needs the permission &quot;See members&quot;.
          </p>
        )}
      </section>
      <section className="fc-section" aria-labelledby="team-permissions">
        <div className="fc-section-head">
          <h2 id="team-permissions" className="fc-section-title">
            Permissions on Forgeron
          </h2>
        </div>
        <p className="fc-section-hint">
          What the people of this team may do in the console, the CLI and the API. A permission that
          includes another checks it for you. You can only give what you hold.
        </p>
        <TeamPermissions
          groups={groups}
          value={granted}
          onChange={(next) => {
            setGranted(next);
            setSaved(false);
          }}
          actor={actor}
          readOnly={!writes}
          everything={everything}
        />
      </section>
      <section className="fc-section" aria-labelledby="team-tools">
        <div className="fc-section-head">
          <h2 id="team-tools" className="fc-section-title">
            Tools this team uses
          </h2>
        </div>
        <p className="fc-muted">
          Each tool says, in its Access tab, which profile this team is given. Open a tool to see or
          change it.
        </p>
      </section>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {saved && !error ? <Notice tone="success">Saved. It applies at the next call.</Notice> : null}
      {writes ? (
        <div className="fc-form-actions">
          <Button
            variant="primary"
            onClick={() => void save()}
            disabled={busy || !dirty || !name.trim()}
          >
            {busy ? "Saving…" : "Save changes"}
          </Button>
          {team.builtIn ? null : (
            <Button
              variant="danger"
              onClick={() => (confirmDelete ? void remove() : setConfirmDelete(true))}
              disabled={busy}
            >
              {confirmDelete ? "Delete for good" : "Delete team"}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function TeamPage({ api, ws, go, params }: PageProps) {
  const id = params.id ?? "";
  const teams = useLoad(() => loadTeams(api.fetchJson), [api]);
  const catalog = useLoad(() => loadPermissionCatalog(api.fetchJson), [api]);
  // Who is in the team is read with `members:read`; without it, the page shows a count.
  const people = useLoad(
    () =>
      can(ws.person, "members:read")
        ? loadMembers(api.fetchJson).then((v) => v.members)
        : Promise.resolve(undefined),
    [api, ws.person],
  );
  const team = teams.data?.find((t) => t.id === id);
  const back = (
    <Button size="sm" href={pathOf("teams")} onClick={routeClick(go)}>
      All teams
    </Button>
  );
  return (
    <Page title={team?.name ?? "Team"} actions={back}>
      {teams.loading || catalog.loading || people.loading ? (
        <Loading shape="page" label="Loading the team" />
      ) : !teams.data || !catalog.data ? (
        <LoadError
          what="The team"
          error={teams.error ?? catalog.error}
          onRetry={() => {
            teams.reload();
            catalog.reload();
          }}
        />
      ) : !team ? (
        <Notice tone="warning" title={`There is no team ${id}.`}>
          It may have been deleted. Open the list to see the teams.
        </Notice>
      ) : (
        <TeamEditor
          key={team.id + team.name + team.members.join(",") + team.permissions.join(",")}
          team={team}
          groups={catalog.data}
          {...(people.data ? { people: people.data } : {})}
          api={api}
          actor={ws.person.permissions}
          writes={can(ws.person, "teams:write")}
          onSaved={teams.reload}
          onDeleted={() => go(pathOf("teams"))}
        />
      )}
    </Page>
  );
}
