import { Button, CopyBlock, EmptyState, Notice, Page, Tabs } from "@forgeron/ui";
import { useState } from "react";
import ToolOverview from "./features/portal/tool-card";
import type { WorkspaceInfo } from "./workspace";
import { AccessMatrixEditor } from "./access-matrix";
import type { Api } from "./api";
import { AdminOnly, Loading, LoadError } from "./states";
import { loadSecretsStatus, SecretsStatus } from "./secrets-status";
import { pathOf, routeClick, toolPath } from "./router";
import { loadTools, ToolsList } from "./tools-list";
import { useLoad } from "./use-load";

// Tools: the list with the version each environment serves, and one tool's access and secrets. The
// tool pages proper (versions, actions, logs) are FOR-130; they take `ToolPage`'s place.

export function ToolsPage({ api, go }: { api: Api; go: (href: string) => void }) {
  const tools = useLoad(() => loadTools(api.fetchJson), [api]);
  return (
    <Page
      title="Tools"
      description="The tools of this workspace and the version each environment serves."
    >
      {tools.loading ? (
        <Loading label="Loading tools" />
      ) : tools.error && !tools.data ? (
        <LoadError what="The tools" error={tools.error} onRetry={tools.reload} />
      ) : tools.data && tools.data.length === 0 ? (
        <EmptyState
          title="No tool yet"
          description="Create a tool with the CLI, link it to this workspace, and deploy it. The commands are on the overview."
          action={
            <div className="fc-stack" style={{ textAlign: "start" }}>
              <CopyBlock label="Create a tool" value="forgeron init" prefix="$" />
              <Button variant="primary" href={pathOf("overview")} onClick={routeClick(go)}>
                Open the overview
              </Button>
            </div>
          }
        />
      ) : (
        <ToolsList rows={tools.data ?? []} onOpen={(tool) => go(toolPath(tool.name))} />
      )}
    </Page>
  );
}

/** `ws` present: the tool card (Overview) comes first; the shell passes it. */
export function ToolPage({
  name,
  api,
  admin,
  ws,
}: {
  name: string;
  api: Api;
  admin: boolean;
  ws?: WorkspaceInfo;
}) {
  const [tab, setTab] = useState(ws ? "overview" : "access");
  const tools = useLoad(() => loadTools(api.fetchJson), [api]);
  const known = tools.data?.some((t) => t.name === name);
  return (
    <Page title={name} description="Who may call what, and the secrets it needs.">
      {tools.loading ? (
        <Loading label="Loading the tool" />
      ) : tools.error ? (
        <LoadError what="The tool" error={tools.error} onRetry={tools.reload} />
      ) : !known ? (
        <Notice
          tone="warning"
          title={`There is no tool named ${name}.`}
          action={
            <Button size="sm" href={pathOf("tools")}>
              Open tools
            </Button>
          }
        >
          It may have been deleted. Open the list to see what is installed.
        </Notice>
      ) : (
        <Tabs
          label="Tool sections"
          tabs={[
            ...(ws ? [{ id: "overview", label: "Overview" }] : []),
            { id: "access", label: "Access" },
            { id: "secrets", label: "Secrets" },
          ]}
          value={tab}
          onChange={setTab}
        >
          {tab === "overview" && ws ? (
            <ToolOverview tool={name} ws={ws} api={api} />
          ) : tab === "access" ? (
            admin ? (
              <AccessMatrixEditor tool={name} fetchJson={api.fetchJson} sendJson={api.sendJson} />
            ) : (
              <AdminOnly what="The access matrix" />
            )
          ) : (
            <ToolSecrets name={name} api={api} />
          )}
        </Tabs>
      )}
    </Page>
  );
}

function ToolSecrets({ name, api }: { name: string; api: Api }) {
  const secrets = useLoad(() => loadSecretsStatus(api.fetchJson, name), [api, name]);
  if (secrets.loading) return <Loading label="Loading secrets" />;
  if (secrets.error)
    return <LoadError what="The secrets status" error={secrets.error} onRetry={secrets.reload} />;
  return (
    <div className="fc-stack">
      <p className="fc-section-hint" style={{ margin: 0 }}>
        Values are never shown. Set one from the terminal.
      </p>
      <SecretsStatus rows={secrets.data ?? []} />
      <CopyBlock label="Set a secret" value={`forgeron secrets set <NAME>`} prefix="$" />
    </div>
  );
}
