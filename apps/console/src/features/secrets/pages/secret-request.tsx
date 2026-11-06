import { addresses } from "@forgeron/platform-contract/client";
import { Button, EmptyState, Field, Input, Notice, Page, Spinner } from "@forgeron/ui";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, ok, typedSender } from "../../../api";
import type { PageProps } from "../../../shell/page-props";
import { useLoad } from "../../../use-load";

// Where a person types a tool's secret after the admin MCP gave them a link (docs/sdk.md §17, D-080).
// The token of the link is in the part of the address after `#`, which a browser never sends to a
// server: it is read once, taken out of the address bar and the history, and sent in a body. The value
// is held in this field only: it is sent in a body, never put in an address, and nothing the platform
// answers brings it back. After a success the field is emptied and the form is gone.

interface Target {
  tool: string;
  environment: string;
  name: string;
  expiresAt: string;
}

const refusal = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 410) return "This link expired. Ask Claude for a new one.";
    if (error.status === 404) {
      return "This link does not work for you: it is for another person, was already used, or never existed. Ask for a new one while signed in as yourself.";
    }
    if (error.status === 401) return "Your session ended. Sign in again, then open the link again.";
  }
  return "The platform could not be reached. Open the link again in a moment.";
};

export default function SecretRequestPage({ api, now }: PageProps) {
  // The token is read once, on first render, and the address is cleaned in an effect.
  const [token] = useState(() => window.location.hash.replace(/^#/, ""));
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const [value, setValue] = useState("");
  const [state, setState] = useState<"typing" | "sending" | "done">("typing");
  const [problem, setProblem] = useState<string>();

  const target = useLoad<Target | undefined>(async () => {
    if (!token) return undefined;
    return ok(await typedSender(api.sendJson)(addresses.lookupSecretRequest, { json: { token } }));
  }, [api, token]);

  if (!token) {
    return (
      <Page title="Enter a secret">
        <EmptyState
          title="Open the link you were given"
          description="This page is reached from a link that Claude gives you, once, for one secret. Ask for a new link if you lost it."
        />
      </Page>
    );
  }
  if (target.loading) {
    return (
      <Page title="Enter a secret">
        <Spinner />
      </Page>
    );
  }
  if (target.error || !target.data) {
    return (
      <Page title="Enter a secret">
        <Notice tone="danger" title="This link cannot be used">
          {refusal(target.error)}
        </Notice>
      </Page>
    );
  }
  const { tool, environment, name, expiresAt } = target.data;

  if (state === "done") {
    return (
      <Page title="Secret saved">
        <Notice tone="success" title={`${name} is set for ${tool}, in ${environment}`}>
          The link no longer works. The value is not shown anywhere; you can close this page.
        </Notice>
      </Page>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!value || state === "sending") return;
    setState("sending");
    setProblem(undefined);
    try {
      ok(
        await typedSender(api.sendJson)(addresses.fulfilSecretRequest, { json: { token, value } }),
      );
      setValue("");
      setState("done");
    } catch (error) {
      setProblem(refusal(error));
      setState("typing");
    }
  };

  const minutes = Math.max(0, Math.ceil((Date.parse(expiresAt) - now().getTime()) / 60_000));
  return (
    <Page
      title="Enter a secret"
      description={
        <>
          For <span className="fc-mono">{tool}</span>, in{" "}
          <span className="fc-mono">{environment}</span>. Type it here: it never goes through
          Claude.
        </>
      }
    >
      <form onSubmit={submit} className="fc-settings" autoComplete="off">
        <Field
          label={name}
          hint={`The link works once and ends in about ${minutes} minute${minutes === 1 ? "" : "s"}.`}
          error={problem}
        >
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
          <Button type="submit" variant="primary" disabled={!value || state === "sending"}>
            {state === "sending" ? "Saving…" : "Save secret"}
          </Button>
        </div>
      </form>
    </Page>
  );
}
