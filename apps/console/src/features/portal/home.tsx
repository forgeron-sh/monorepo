import "./portal.css";
import { Badge, Button, EmptyState, Field, Input, Page, Stat, ToolCard } from "@forgeron/ui";
import { useState } from "react";
import type { Api } from "../../api";
import { FirstRun, firstRunSteps } from "../../overview";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import type { WorkspaceInfo } from "../../workspace";
import { interfacesOf, loadCatalog, type CatalogTool } from "./catalog";

// Home: what a person can use, and what they could ask for. An admin sees the same two lists, with a
// strip of the workspace's numbers (and the first-run checklist until it is done) above them.

export interface PortalHomeProps {
  ws: WorkspaceInfo;
  api: Api;
  go: (href: string) => void;
}

const toolHref = (name: string) => `/tools/${encodeURIComponent(name)}`;

const matches = (tool: CatalogTool, query: string) =>
  `${tool.name} ${tool.title} ${tool.summary}`.toLowerCase().includes(query.trim().toLowerCase());

export function PortalHome({ ws, api, go }: PortalHomeProps) {
  const catalog = useLoad(() => loadCatalog(api.fetchJson), [api]);
  const [query, setQuery] = useState("");
  const tools = catalog.data ?? [];
  const mine = tools.filter((t) => t.access === "granted" && matches(t, query));
  const others = tools.filter((t) => t.access === "requestable" && matches(t, query));
  const admin = ws.person.admin;

  return (
    <Page
      title="Home"
      description={
        admin ? (
          <>
            Workspace <span className="fc-mono">{ws.workspace}</span>
          </>
        ) : (
          `The tools of ${ws.workspace} you can use, and the ones you can ask for.`
        )
      }
    >
      {admin ? <AdminStrip ws={ws} api={api} go={go} /> : null}

      {catalog.loading ? (
        <Loading label="Loading your tools" />
      ) : catalog.error && !catalog.data ? (
        <LoadError what="Your tools" error={catalog.error} onRetry={catalog.reload} />
      ) : (
        <>
          {tools.length > 0 ? (
            <div className="fp-search">
              <Field label="Search tools">
                {(control) => (
                  <Input
                    {...control}
                    type="search"
                    value={query}
                    placeholder="Name or what it does"
                    onChange={(event) => setQuery(event.target.value)}
                  />
                )}
              </Field>
            </div>
          ) : null}

          <section className="fc-section" aria-labelledby="my-tools">
            <div className="fc-section-head">
              <h2 id="my-tools" className="fc-section-title">
                My tools
              </h2>
              {mine.length > 0 ? <span className="fc-muted">{mine.length}</span> : null}
            </div>
            {mine.length > 0 ? (
              <ul className="fp-grid">
                {mine.map((tool) => (
                  <ToolCard
                    key={tool.name}
                    name={tool.name}
                    summary={tool.summary}
                    href={toolHref(tool.name)}
                    onNavigate={go}
                    meta={<ToolMeta tool={tool} />}
                    footer={
                      tool.interfaces.web ? (
                        <Button size="sm" href={`/t/${encodeURIComponent(tool.name)}/`}>
                          Open
                        </Button>
                      ) : (
                        <Button size="sm" href={toolHref(tool.name)} onClick={navigate(go)}>
                          Connect
                        </Button>
                      )
                    }
                  />
                ))}
              </ul>
            ) : query.trim() ? (
              <EmptyState
                title="No tool of yours matches"
                description={`Nothing matches "${query.trim()}".`}
              />
            ) : (
              <EmptyState
                title="You do not use a tool yet"
                description={
                  others.length > 0
                    ? "Pick one in the catalog below and ask an admin for access."
                    : admin
                      ? "Deploy a tool, then it shows up here."
                      : "Ask an admin of this workspace which tools you can use."
                }
              />
            )}
          </section>

          {others.length > 0 || (tools.some((t) => t.access === "requestable") && query.trim()) ? (
            <section className="fc-section" aria-labelledby="catalog">
              <div className="fc-section-head">
                <h2 id="catalog" className="fc-section-title">
                  Catalog
                </h2>
                {others.length > 0 ? <span className="fc-muted">{others.length}</span> : null}
              </div>
              <p className="fc-section-hint">
                Tools you do not use yet. Ask an admin to give you one of the roles shown.
              </p>
              {others.length > 0 ? (
                <ul className="fp-grid">
                  {others.map((tool) => (
                    <ToolCard
                      key={tool.name}
                      name={tool.name}
                      summary={tool.summary}
                      href={toolHref(tool.name)}
                      onNavigate={go}
                      meta={<ToolMeta tool={tool} />}
                      footer={
                        <p className="fp-ask">
                          <span className="fp-ask-label">Ask for the role</span>{" "}
                          {tool.roles.length > 0 ? (
                            <span className="fc-badges">
                              {tool.roles.map((role) => (
                                <Badge key={role.name} mono>
                                  {role.label}
                                </Badge>
                              ))}
                            </span>
                          ) : (
                            "Ask an admin"
                          )}
                        </p>
                      }
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No tool of the catalog matches"
                  description={`Nothing matches "${query.trim()}".`}
                />
              )}
            </section>
          ) : null}
        </>
      )}
    </Page>
  );
}

const navigate = (go: (href: string) => void) => (event: React.MouseEvent<HTMLAnchorElement>) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  go(event.currentTarget.getAttribute("href") ?? "/");
};

function ToolMeta({ tool }: { tool: CatalogTool }) {
  return (
    <>
      {tool.productionVersion ? (
        <Badge mono>{`v${tool.productionVersion}`}</Badge>
      ) : (
        <Badge>not deployed</Badge>
      )}
      {interfacesOf(tool).map((label) => (
        <Badge key={label} mono>
          {label}
        </Badge>
      ))}
    </>
  );
}

function AdminStrip({ ws, api, go }: PortalHomeProps) {
  const steps = firstRunSteps(ws);
  const unfinished = steps.some((s) => !s.done);
  return (
    <>
      <section className="fc-section" aria-labelledby="workspace-numbers">
        <div className="fc-section-head">
          <h2 id="workspace-numbers" className="fc-section-title">
            In this workspace
          </h2>
          <Button size="sm" variant="ghost" href="/members" onClick={navigate(go)}>
            Invite people
          </Button>
        </div>
        <div className="fc-stats">
          <Stat label="Members" value={String(ws.setup.members)} />
          <Stat label="Pending invitations" value={String(ws.setup.invitations)} />
          <Stat label="Tools" value={String(ws.setup.tools)} />
          <Stat label="Tools deployed" value={String(ws.setup.deployed)} />
        </div>
      </section>
      {unfinished ? <FirstRun ws={ws} fetchJson={api.fetchJson} go={go} /> : null}
    </>
  );
}
