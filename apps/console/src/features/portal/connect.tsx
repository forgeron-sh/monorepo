import { CopyBlock } from "@forgeron/ui";
import type { ToolCardData } from "./catalog";

// How to reach a tool, one block per interface. The addresses and the command come from the platform;
// the steps around them are the same for every tool.

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="fp-step">
    <span className="fp-step-n" aria-hidden="true">
      {n}
    </span>
    <div>{children}</div>
  </li>
);

export function ConnectInstructions({ tool }: { tool: ToolCardData }) {
  const { mcp, api, cli } = tool.connect;
  if (!mcp && !api && !cli && !tool.interfaces.web)
    return <p className="fc-muted">This tool has no interface to connect to yet.</p>;
  return (
    <div className="fp-connect">
      {mcp ? (
        <section aria-labelledby="connect-mcp">
          <h3 id="connect-mcp" className="fp-h3">
            Claude (MCP)
          </h3>
          <ol className="fp-steps">
            <Step n={1}>Open Claude and go to Settings, then Connectors.</Step>
            <Step n={2}>
              Choose Add custom connector, and paste this address.
              <CopyBlock label={`${tool.name} MCP address`} value={mcp.url} />
            </Step>
            <Step n={3}>Sign in with your work account when Claude asks, then allow access.</Step>
            <Step n={4}>
              Ask Claude something about {tool.title}. It lists what it can do for you.
            </Step>
          </ol>
        </section>
      ) : null}
      {api ? (
        <section aria-labelledby="connect-api">
          <h3 id="connect-api" className="fp-h3">
            API
          </h3>
          <ol className="fp-steps">
            <Step n={1}>
              Create a personal token in{" "}
              <a href="/settings" className="fp-link">
                Settings, Security
              </a>
              . It is shown once: copy it somewhere safe.
            </Step>
            <Step n={2}>
              Send it as a bearer token to this address.
              <CopyBlock label={`${tool.name} API address`} value={api.baseUrl} />
            </Step>
          </ol>
        </section>
      ) : null}
      {cli ? (
        <section aria-labelledby="connect-cli">
          <h3 id="connect-cli" className="fp-h3">
            Terminal (CLI)
          </h3>
          <ol className="fp-steps">
            <Step n={1}>
              Sign in once from your terminal.
              <CopyBlock label="Sign in from your terminal" value="forgeron login" prefix="$" />
            </Step>
            <Step n={2}>
              Run the tool.
              <CopyBlock label={`${tool.name} command`} value={cli.command} prefix="$" />
            </Step>
          </ol>
        </section>
      ) : null}
      {tool.interfaces.web ? (
        <section aria-labelledby="connect-web">
          <h3 id="connect-web" className="fp-h3">
            Web
          </h3>
          <p>Use the Open button at the top of the page. You are already signed in.</p>
        </section>
      ) : null}
    </div>
  );
}
