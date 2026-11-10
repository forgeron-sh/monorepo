import { addresses } from "@forgeron/platform-contract/client";
import { Button, Checkbox, Notice } from "@forgeron/ui";
import { useState } from "react";
import { explain, ok, typedClient, typedSender, type FetchJson, type SendJson } from "../../../api";
import { loadMembers } from "../../../members";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import type { ToolTabProps } from "../tabs";

// Who may add the tool to their library (D-117). A tool installed from a marketplace starts with
// nobody; a tool deployed before libraries is open to everyone without an install, until a rule is
// saved here. What each person may then do in the tool stays the Access tab's roles × actions.

type Mode = "nobody" | "everyone" | "roles" | "people";

async function loadAvailability(fetchJson: FetchJson, tool: string) {
  return ok(await typedClient(fetchJson)(addresses.getAvailability, { params: { tool } }));
}

async function saveAvailability(
  send: SendJson,
  tool: string,
  rule: { mode: Mode; roles: string[]; people: string[] },
) {
  return ok(
    await typedSender(send)(addresses.putAvailability, {
      params: { tool },
      json: {
        mode: rule.mode,
        ...(rule.mode === "roles" ? { roles: rule.roles } : {}),
        ...(rule.mode === "people" ? { people: rule.people } : {}),
      },
    }),
  );
}

const CHOICES: Array<{ mode: Mode; label: string; hint: string }> = [
  { mode: "nobody", label: "Nobody yet", hint: "Only admins can add it, to try it." },
  { mode: "everyone", label: "Everyone in the workspace", hint: "Every member can add it." },
  { mode: "roles", label: "Some roles", hint: "Members with one of these roles can add it." },
  { mode: "people", label: "Some people", hint: "Only the people you pick can add it." },
];

const toggle = (list: string[], value: string, on: boolean) =>
  on ? [...new Set([...list, value])] : list.filter((v) => v !== value);

export default function AvailabilityTab({ tool, api }: ToolTabProps) {
  const loaded = useLoad(
    async () => ({
      rule: await loadAvailability(api.fetchJson, tool),
      members: (await loadMembers(api.fetchJson)).members,
    }),
    [api, tool],
  );
  const [saved, setSaved] = useState(false);
  if (loaded.loading && !loaded.data) {
    return <Loading shape="form" label="Loading who can use the tool" />;
  }
  if (!loaded.data) {
    return <LoadError what="Who can use the tool" error={loaded.error} onRetry={loaded.reload} />;
  }
  return (
    <AvailabilityForm
      key={loaded.data.rule.updatedAt ?? "open"}
      tool={tool}
      api={api}
      rule={loaded.data.rule}
      members={loaded.data.members}
      saved={saved}
      onSaving={() => setSaved(false)}
      onSaved={() => {
        setSaved(true);
        loaded.reload();
      }}
    />
  );
}

type Rule = Awaited<ReturnType<typeof loadAvailability>>;

function AvailabilityForm({
  tool,
  api,
  rule,
  members,
  saved,
  onSaving,
  onSaved,
}: Pick<ToolTabProps, "tool" | "api"> & {
  rule: Rule;
  members: Array<{ id: string; name: string; email: string; roles: string[] }>;
  saved: boolean;
  onSaving: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>(rule.mode === "open" ? "everyone" : rule.mode);
  const [roles, setRoles] = useState<string[]>(rule.roles);
  const [people, setPeople] = useState<string[]>(rule.people);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const workspaceRoles = [...new Set(members.flatMap((m) => m.roles))]
    .filter((r) => r !== "admin")
    .sort();

  const save = async () => {
    setBusy(true);
    setError(undefined);
    onSaving();
    try {
      await saveAvailability(api.sendJson, tool, { mode, roles, people });
      onSaved();
    } catch (e) {
      setError(explain(e, "Who can use the tool was not saved. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="fc-section" aria-labelledby="availability-title">
      <h2 id="availability-title" className="fc-section-title">
        Who can add this tool
      </h2>
      <p className="fc-section-hint">
        People add the tool to their library themselves, then give what it asks of them. What they
        may do in it is set in the Access tab.
      </p>
      {rule.mode === "open" ? (
        <Notice tone="info">
          This tool is open to everyone without being added, as before libraries. Once you save a
          choice here, each person adds it from their library to keep using it.
        </Notice>
      ) : null}
      <fieldset className="fc-fieldset">
        <legend className="fc-sr">Who can add it</legend>
        {CHOICES.map((c) => (
          <label key={c.mode} className="fc-radio">
            <input
              type="radio"
              name="availability"
              value={c.mode}
              checked={mode === c.mode}
              onChange={() => setMode(c.mode)}
            />
            <span>
              <strong>{c.label}</strong> <span className="fc-muted">{c.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {mode === "roles" ? (
        workspaceRoles.length > 0 ? (
          <div className="fc-checks">
            {workspaceRoles.map((r) => (
              <Checkbox
                key={r}
                label={r}
                checked={roles.includes(r)}
                onChange={(e) => setRoles(toggle(roles, r, e.target.checked))}
              />
            ))}
          </div>
        ) : (
          <p className="fc-muted">No member has a role other than admin yet.</p>
        )
      ) : null}
      {mode === "people" ? (
        <div className="fc-checks">
          {members.map((m) => (
            <Checkbox
              key={m.id}
              label={`${m.name} (${m.email})`}
              checked={people.includes(m.id)}
              onChange={(e) => setPeople(toggle(people, m.id, e.target.checked))}
            />
          ))}
        </div>
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {saved ? <Notice tone="success">Saved.</Notice> : null}
      <div>
        <Button variant="primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
