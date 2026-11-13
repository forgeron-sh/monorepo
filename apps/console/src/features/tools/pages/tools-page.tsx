import {
  Badge,
  Button,
  CopyBlock,
  EmptyState,
  Input,
  Page,
  Table,
  type TableColumn,
} from "@forgeron/ui";
import { useMemo, useState } from "react";
import type { PageProps } from "../../../shell/page-props";
import { ago } from "../../../format";
import { pathOf, routeClick, toolPath } from "../../../router";
import { can } from "../../../shell/access";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadTools, type ToolRow } from "../api";
import { ToolIcon } from "../components";
import { IMPORTING_LABEL, useImporting, type Importing } from "../ci";
import { NewToolDialog, RepositoryDialog } from "../repository-dialog";
import "../tools.css";

// The workspace's tools: a table or a grid, searchable. A row opens the tool's page.

type View = "table" | "grid";
const VIEW_KEY = "forgeron.tools.view";

function savedView(): View {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "table";
  } catch {
    return "table";
  }
}

/** What a tool with nothing deployed says: what its CI is doing, or "Not deployed" with no repository. */
const nothingLabel = (importing: Importing | undefined) =>
  importing ? IMPORTING_LABEL[importing.kind] : "Not deployed";

/**
 * Live (a version serves production), preview only, or nothing deployed: then, for a tool added from
 * GitHub, what its CI is doing (Importing, CI failed with a link to the run, Waiting for CI).
 */
function State({
  tool,
  importing,
  link,
}: {
  tool: ToolRow;
  importing?: Importing;
  link?: boolean;
}) {
  if (tool.production) {
    return (
      <Badge tone="success" dot>
        Live
      </Badge>
    );
  }
  if (tool.previews.length > 0) return <Badge dot>Preview only</Badge>;
  if (!importing) return <Badge dot>Not deployed</Badge>;
  return (
    <>
      <Badge tone={importing.kind === "failed" ? "danger" : "warning"} dot>
        {IMPORTING_LABEL[importing.kind]}
      </Badge>
      {link && importing.kind === "failed" ? (
        <a
          className="ft-run-link"
          href={importing.runUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          View the run ↗
        </a>
      ) : null}
    </>
  );
}

const previews = (tool: ToolRow) =>
  `${tool.previews.length} ${tool.previews.length === 1 ? "preview" : "previews"}`;

export default function ToolsPage({ api, go, ws, now }: PageProps) {
  const workspace = ws.workspace;
  const tools = useLoad(() => loadTools(api.fetchJson), [api]);
  const importing = useImporting(api, tools.data);
  const [view, setView] = useState<View>(savedView);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [making, setMaking] = useState(false);

  const choose = (next: View) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // A private window keeps nothing: the choice lasts for this screen.
    }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tools.data ?? []).filter(
      (t) => !q || t.name.toLowerCase().includes(q) || (t.summary ?? "").toLowerCase().includes(q),
    );
  }, [tools.data, query]);

  const open = (tool: ToolRow) => go(toolPath(tool.name));
  const clock = now();

  const columns: Array<TableColumn<ToolRow>> = [
    {
      key: "name",
      header: "Tool",
      render: (t) => (
        <span className="ft-tool">
          <ToolIcon name={t.name} />
          <span className="ft-tool-text">
            <span className="ft-tool-name">{t.name}</span>
            {t.summary ? <span className="ft-tool-summary">{t.summary}</span> : null}
          </span>
        </span>
      ),
    },
    {
      key: "production",
      header: "Production",
      render: (t) =>
        t.production ? (
          <Badge mono>{t.production}</Badge>
        ) : (
          <span className="fc-muted">{nothingLabel(importing[t.name])}</span>
        ),
    },
    { key: "previews", header: "Previews", render: (t) => t.previews.length },
    {
      key: "last",
      header: "Last deployment",
      render: (t) =>
        t.lastDeployment ? (
          <time dateTime={t.lastDeployment.at} title={t.lastDeployment.at}>
            {ago(t.lastDeployment.at, clock)}
          </time>
        ) : (
          <span className="fc-muted">Never</span>
        ),
    },
    {
      key: "state",
      header: "Status",
      render: (t) => <State tool={t} importing={importing[t.name]} link />,
    },
  ];

  return (
    <Page
      title="Tools"
      description="The tools of this workspace, the version production serves and their previews."
      actions={
        can(ws.person, "tools:write") ? (
          <>
            <Button onClick={() => setMaking(true)}>New tool</Button>
            <Button variant="primary" onClick={() => setAdding(true)}>
              Add from GitHub
            </Button>
          </>
        ) : undefined
      }
    >
      {adding ? (
        <RepositoryDialog api={api} onClose={() => setAdding(false)} onAdded={tools.reload} />
      ) : null}
      {making ? (
        <NewToolDialog api={api} onClose={() => setMaking(false)} onAdded={tools.reload} />
      ) : null}
      {tools.loading ? (
        <Loading shape="cards" label="Loading tools" />
      ) : !tools.data ? (
        <LoadError what="The tools" error={tools.error} onRetry={tools.reload} />
      ) : tools.data.length === 0 ? (
        <EmptyState
          title="No tool yet"
          description="Create a tool, link it to this workspace and deploy it. Its first preview shows up here."
          action={
            <div className="fc-stack" style={{ textAlign: "start" }}>
              <CopyBlock label="Create a tool" value="forgeron init" prefix="$" />
              <CopyBlock
                label="Link it to this workspace"
                value={`forgeron link --workspace ${workspace}`}
                prefix="$"
              />
              <CopyBlock
                label="Deploy a preview"
                value="forgeron deploy --env preview --branch <name>"
                prefix="$"
              />
              <Button variant="primary" href={pathOf("overview")} onClick={routeClick(go)}>
                Open the overview
              </Button>
            </div>
          }
        />
      ) : (
        <div className="fc-stack">
          <div className="ft-toolbar">
            <Input
              type="search"
              aria-label="Search tools"
              placeholder="Search tools"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="ft-toggle" role="group" aria-label="View">
              {(["table", "grid"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="ft-toggle-btn"
                  aria-pressed={view === v}
                  onClick={() => choose(v)}
                >
                  {v === "table" ? "Table" : "Grid"}
                </button>
              ))}
            </div>
          </div>
          {view === "table" ? (
            <Table
              columns={columns}
              rows={shown}
              rowKey={(t) => t.name}
              onRowClick={open}
              empty={`No tool matches "${query}".`}
            />
          ) : shown.length === 0 ? (
            <p className="fc-muted ft-none">No tool matches "{query}".</p>
          ) : (
            <ul className="ft-grid">
              {shown.map((t) => (
                <li key={t.name}>
                  <a className="ft-card" href={toolPath(t.name)} onClick={routeClick(go)}>
                    <span className="ft-card-head">
                      <ToolIcon name={t.name} size={36} />
                      <State tool={t} importing={importing[t.name]} />
                    </span>
                    <span className="ft-tool-name">{t.name}</span>
                    <span className="ft-tool-summary">{t.summary ?? "No description."}</span>
                    <span className="ft-card-foot">
                      {t.production ? (
                        <Badge mono>{t.production}</Badge>
                      ) : (
                        <span>{nothingLabel(importing[t.name])}</span>
                      )}
                      <span>{previews(t)}</span>
                      <span>
                        {t.lastDeployment ? ago(t.lastDeployment.at, clock) : "Never deployed"}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Page>
  );
}
