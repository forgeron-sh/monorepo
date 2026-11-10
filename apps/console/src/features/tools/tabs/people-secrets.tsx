import { addresses } from "@forgeron/platform-contract/client";
import { Button, Field, Input, Notice, Select, Table, type TableColumn } from "@forgeron/ui";
import { useState, type FormEvent } from "react";
import { explain, ok, typedClient, typedSender } from "../../../api";
import { loadMembers } from "../../../members";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import type { ToolTabProps } from "../tabs";

// What people hold for a tool (D-036, D-107), for admins. Names only: a value is never shown. An admin
// can set a person's secret, for example to unblock them: it is audited and the person sees it in their
// own page of secrets (and is told by mail where mail is on). Or revoke it, and the person is asked again.

interface Holder {
  person: string;
  label: string;
  names: string[];
}

async function load(api: ToolTabProps["api"], tool: string) {
  const client = typedClient(api.fetchJson);
  const held = ok(await client(addresses.listUserSecretHolders, { params: { tool } }));
  const members = (await loadMembers(api.fetchJson)).members;
  const label = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.name} (${m.email})` : id;
  };
  const holders: Holder[] = (held.holders ?? []).map((h) => ({
    person: String(h.person),
    label: label(String(h.person)),
    names: (h.names ?? []).map(String),
  }));
  return { holders, members };
}

const NAME = /^[A-Z][A-Z0-9_]*$/;

export default function PeopleSecrets({ tool, api }: ToolTabProps) {
  const loaded = useLoad(() => load(api, tool), [api, tool]);
  const [person, setPerson] = useState("");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [problem, setProblem] = useState<string>();
  const [done, setDone] = useState<string>();

  if (loaded.loading) return <Loading shape="table" label="Loading what people hold" />;
  if (loaded.error || !loaded.data) {
    return <LoadError what="The people's secrets" error={loaded.error} onRetry={loaded.reload} />;
  }
  const { holders, members } = loaded.data;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!person || !NAME.test(name) || !value || state === "sending") return;
    setState("sending");
    setProblem(undefined);
    setDone(undefined);
    try {
      ok(
        await typedSender(api.sendJson)(addresses.setUserSecret, {
          params: { tool, person, name },
          json: { value },
        }),
      );
      setValue("");
      setDone(`${name} is set for that person. They can see that an administrator set it.`);
      loaded.reload();
    } catch (error) {
      setProblem(
        explain(error, "The secret was not set. Check that the tool declares this secret."),
      );
    } finally {
      setState("idle");
    }
  };

  const revoke = async (holder: Holder, secret: string) => {
    setProblem(undefined);
    setDone(undefined);
    try {
      ok(
        await typedSender(api.sendJson)(addresses.revokeUserSecret, {
          params: { tool, person: holder.person, name: secret },
        }),
      );
      setDone(`${secret} is revoked for ${holder.label}. They are asked for it again.`);
      loaded.reload();
    } catch (error) {
      setProblem(explain(error, "The secret was not revoked."));
    }
  };

  const columns: Array<TableColumn<Holder>> = [
    { key: "person", header: "Person", render: (h) => h.label },
    {
      key: "names",
      header: "Secrets",
      render: (h) => (
        <span className="fc-row">
          {h.names.map((n) => (
            <Button
              key={n}
              size="sm"
              onClick={() => revoke(h, n)}
              aria-label={`Revoke ${n} for ${h.label}`}
            >
              {n} · Revoke
            </Button>
          ))}
        </span>
      ),
    },
  ];

  return (
    <section className="fc-stack" aria-labelledby="people-secrets-title">
      <h2 id="people-secrets-title" className="fc-section-title">
        People&apos;s secrets
      </h2>
      <p className="fc-section-hint" style={{ margin: 0 }}>
        The secrets people gave this tool, by name. A value is never shown. Setting one for a person
        is recorded in the audit log, and they see it in their own secrets.
      </p>
      {problem ? (
        <Notice tone="danger" title="Not done">
          {problem}
        </Notice>
      ) : null}
      {done ? (
        <Notice tone="success" title="Done">
          {done}
        </Notice>
      ) : null}
      <Table
        columns={columns}
        rows={holders}
        rowKey={(h) => h.person}
        empty="Nobody holds a secret for this tool yet."
      />
      <form onSubmit={submit} className="fc-settings" autoComplete="off">
        <Field label="Person">
          {(control) => (
            <Select
              {...control}
              value={person}
              onChange={(event) => setPerson(event.target.value)}
              placeholder="Choose a person"
              options={members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }))}
            />
          )}
        </Field>
        <Field label="Secret name" hint="As the tool declares it, capital letters, digits and _.">
          {(control) => (
            <Input
              {...control}
              mono
              value={name}
              onChange={(event) => setName(event.target.value.toUpperCase())}
            />
          )}
        </Field>
        <Field label="Value">
          {(control) => (
            <Input
              {...control}
              mono
              type="password"
              name="secret-value"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          )}
        </Field>
        <div>
          <Button
            type="submit"
            variant="primary"
            disabled={!person || !NAME.test(name) || !value || state === "sending"}
          >
            {state === "sending" ? "Saving…" : "Set for this person"}
          </Button>
        </div>
      </form>
    </section>
  );
}
