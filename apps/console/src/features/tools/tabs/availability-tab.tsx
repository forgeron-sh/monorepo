import { addresses } from "@forgeron/platform-contract/client";
import { Button, Checkbox, Notice } from "@forgeron/ui";
import { useId, useState } from "react";
import { explain, ok, typedClient, typedSender, type FetchJson, type SendJson } from "../../../api";
import { loadMembers } from "../../../members";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadBranches } from "../api";
import type { ToolTabProps } from "../tabs";

// Who may add the tool to their library (D-117), and who may pilot each branch (D-119). A tool
// installed from a marketplace starts with nobody; a tool deployed before libraries is open to
// everyone without an install, until a rule is saved here. A branch is for admins and developers until
// it is opened here: the people named then add it as a pilot, a tool of its own with its own data.
// What each person may do in the tool stays the Access tab's roles × actions.

type Mode = "nobody" | "everyone" | "roles" | "people";
type Choice = { mode: Mode; roles: string[]; people: string[] };

const json = (rule: Choice) => ({
  mode: rule.mode,
  ...(rule.mode === "roles" ? { roles: rule.roles } : {}),
  ...(rule.mode === "people" ? { people: rule.people } : {}),
});

async function loadRule(fetchJson: FetchJson, tool: string, branch?: string) {
  const client = typedClient(fetchJson);
  return ok(
    branch
      ? await client(addresses.getPilotAvailability, { params: { tool, branch } })
      : await client(addresses.getAvailability, { params: { tool } }),
  );
}

async function saveRule(send: SendJson, tool: string, rule: Choice, branch?: string) {
  const client = typedSender(send);
  return ok(
    branch
      ? await client(addresses.putPilotAvailability, { params: { tool, branch }, json: json(rule) })
      : await client(addresses.putAvailability, { params: { tool }, json: json(rule) }),
  );
}

const CHOICES: Array<{ mode: Mode; label: string; hint: string }> = [
  { mode: "nobody", label: "Nobody yet", hint: "Only admins can add it, to try it." },
  { mode: "everyone", label: "Everyone in the workspace", hint: "Every member can add it." },
  { mode: "roles", label: "Some roles", hint: "Members with one of these roles can add it." },
  { mode: "people", label: "Some people", hint: "Only the people you pick can add it." },
];
const PILOT_CHOICES: typeof CHOICES = [
  { mode: "nobody", label: "Admins and developers only", hint: "As every branch." },
  { mode: "everyone", label: "Everyone in the workspace", hint: "Every member can pilot it." },
  { mode: "roles", label: "Some roles", hint: "Members with one of these roles can pilot it." },
  { mode: "people", label: "Some people", hint: "Only the people you pick can pilot it." },
];

const toggle = (list: string[], value: string, on: boolean) =>
  on ? [...new Set([...list, value])] : list.filter((v) => v !== value);

type Member = { id: string; name: string; email: string; roles: string[] };

export default function AvailabilityTab({ tool, api }: ToolTabProps) {
  const loaded = useLoad(async () => {
    const branches = await loadBranches(api.fetchJson, tool).catch(() => ({ branches: [] }));
    return {
      members: (await loadMembers(api.fetchJson)).members,
      branches: branches.branches.flatMap((b) => (b.branch ? [b.branch] : [])),
    };
  }, [api, tool]);
  if (loaded.loading && !loaded.data) {
    return <Loading shape="form" label="Loading who can use the tool" />;
  }
  if (!loaded.data) {
    return <LoadError what="Who can use the tool" error={loaded.error} onRetry={loaded.reload} />;
  }
  const { members, branches } = loaded.data;
  return (
    <div className="fc-stack">
      <RuleSection tool={tool} api={api} members={members} />
      <section className="fc-section" aria-labelledby="pilots-title">
        <h2 id="pilots-title" className="fc-section-title">
          Pilots
        </h2>
        <p className="fc-section-hint">
          Open a branch to some people: they add it as a tool of its own, apart from the one
          everyone uses, with its own data. A new version reaches production only when you promote
          it.
        </p>
        {branches.length === 0 ? (
          <p className="fc-muted">No branch has a preview right now.</p>
        ) : (
          branches.map((branch) => (
            <details key={branch} className="fc-details">
              <summary>
                <span className="fc-mono">{branch}</span>
              </summary>
              <RuleSection tool={tool} api={api} members={members} branch={branch} />
            </details>
          ))
        )}
      </section>
    </div>
  );
}

function RuleSection({
  tool,
  api,
  members,
  branch,
}: Pick<ToolTabProps, "tool" | "api"> & { members: Member[]; branch?: string }) {
  const rule = useLoad(() => loadRule(api.fetchJson, tool, branch), [api, tool, branch]);
  const [saved, setSaved] = useState(false);
  if (rule.loading && !rule.data) return <Loading shape="form" label="Loading the rule" />;
  if (!rule.data) return <LoadError what="The rule" error={rule.error} onRetry={rule.reload} />;
  return (
    <AvailabilityForm
      key={rule.data.updatedAt ?? "none"}
      rule={rule.data}
      members={members}
      branch={branch}
      saved={saved}
      save={async (choice) => {
        setSaved(false);
        await saveRule(api.sendJson, tool, choice, branch);
        setSaved(true);
        rule.reload();
      }}
    />
  );
}

type Rule = Awaited<ReturnType<typeof loadRule>>;

function AvailabilityForm({
  rule,
  members,
  branch,
  saved,
  save,
}: {
  rule: Rule;
  members: Member[];
  branch?: string;
  saved: boolean;
  save: (choice: Choice) => Promise<void>;
}) {
  const pilot = branch !== undefined;
  const [mode, setMode] = useState<Mode>(
    rule.mode === "open" ? (pilot ? "nobody" : "everyone") : rule.mode,
  );
  const [roles, setRoles] = useState<string[]>(rule.roles);
  const [people, setPeople] = useState<string[]>(rule.people);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const name = useId();
  const workspaceRoles = [...new Set(members.flatMap((m) => m.roles))]
    .filter((r) => r !== "admin")
    .sort();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await save({ mode, roles, people });
    } catch (e) {
      setError(explain(e, "Who can use the tool was not saved. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="fc-section" aria-label={pilot ? `Who can pilot ${branch}` : undefined}>
      {pilot ? null : (
        <>
          <h2 className="fc-section-title">Who can add this tool</h2>
          <p className="fc-section-hint">
            People add the tool to their library themselves, then give what it asks of them. What
            they may do in it is set in the Access tab. A new version reaches them when you promote
            it to production.
          </p>
          {rule.mode === "open" ? (
            <Notice tone="info">
              This tool is open to everyone without being added, as before libraries. Once you save
              a choice here, each person adds it from their library to keep using it.
            </Notice>
          ) : null}
        </>
      )}
      <fieldset className="fc-fieldset">
        <legend className="fc-sr">{pilot ? `Who can pilot ${branch}` : "Who can add it"}</legend>
        {(pilot ? PILOT_CHOICES : CHOICES).map((c) => (
          <label key={c.mode} className="fc-radio">
            <input
              type="radio"
              name={name}
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
        <Button variant="primary" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
