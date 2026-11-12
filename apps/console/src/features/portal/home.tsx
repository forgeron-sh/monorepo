import "./portal.css";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Notice,
  Page,
  Stat,
  ToolCard,
} from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../api";
import { FirstRun, firstRunSteps } from "../../overview";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import type { WorkspaceInfo } from "../../workspace";
import {
  addPilot,
  addToLibrary,
  channelLabel,
  libraryHref,
  loadLibrary,
  type LibraryTool,
} from "./library";

// Home is the person's library (D-117): the tools they added, and those they may add with a click. An
// admin sees the same two lists, with a strip of the workspace's numbers (and the first-run checklist
// until it is done) above them. Nothing technical: no version, role or interface.

export interface PortalHomeProps {
  ws: WorkspaceInfo;
  api: Api;
  go: (href: string) => void;
}

const matches = (tool: LibraryTool, query: string) =>
  `${tool.name} ${tool.title} ${tool.summary}`.toLowerCase().includes(query.trim().toLowerCase());

export function PortalHome({ ws, api, go }: PortalHomeProps) {
  const library = useLoad(() => loadLibrary(api.fetchJson), [api]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string>();
  const keyOf = (t: LibraryTool) => (t.pilot ? `${t.name}@${t.pilot}` : t.name);
  const [error, setError] = useState<string>();
  const tools = library.data ?? [];
  const mine = tools.filter((t) => t.installed && matches(t, query));
  const others = tools.filter((t) => !t.installed && matches(t, query));
  const admin = ws.person.admin;

  // Adding a tool goes straight to its page, where the person finishes its setup and sees how to use it.
  const add = async (tool: LibraryTool) => {
    setAdding(keyOf(tool));
    setError(undefined);
    try {
      if (tool.pilot) await addPilot(api.sendJson, tool.name, tool.pilot);
      else await addToLibrary(api.sendJson, tool.name);
      go(libraryHref(tool.name, tool.pilot));
    } catch (e) {
      setError(explain(e, `${tool.title} could not be added. Try again.`));
      setAdding(undefined);
    }
  };

  return (
    <Page
      title="Home"
      description={
        admin ? (
          <>
            Workspace <span className="fc-mono">{ws.workspace}</span>
          </>
        ) : (
          "Your tools, and the ones you can add."
        )
      }
    >
      {admin ? <AdminStrip ws={ws} api={api} go={go} /> : null}

      {library.loading ? (
        <Loading shape="cards" label="Loading your tools" />
      ) : library.error && !library.data ? (
        <LoadError what="Your tools" error={library.error} onRetry={library.reload} />
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
          {error ? <Notice tone="danger">{error}</Notice> : null}

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
                    key={keyOf(tool)}
                    name={tool.title}
                    summary={tool.summary}
                    href={libraryHref(tool.name, tool.pilot)}
                    onNavigate={go}
                    meta={<Tags tool={tool} />}
                    footer={
                      <Button
                        size="sm"
                        href={libraryHref(tool.name, tool.pilot)}
                        onClick={navigate(go)}
                      >
                        {tool.needsSetup ? "Finish setup" : "Use"}
                      </Button>
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
                title="You have no tool yet"
                description={
                  others.length > 0
                    ? "Add one of the tools below: it takes a click."
                    : admin
                      ? "Install a tool from the Marketplace, then choose who can use it."
                      : "No tool is available to you yet. Ask an admin of this workspace."
                }
              />
            )}
          </section>

          {others.length > 0 || (tools.some((t) => !t.installed) && query.trim()) ? (
            <section className="fc-section" aria-labelledby="available">
              <div className="fc-section-head">
                <h2 id="available" className="fc-section-title">
                  Available to you
                </h2>
                {others.length > 0 ? <span className="fc-muted">{others.length}</span> : null}
              </div>
              <p className="fc-section-hint">Add a tool to your library to start using it.</p>
              {others.length > 0 ? (
                <ul className="fp-grid">
                  {others.map((tool) => (
                    <ToolCard
                      key={keyOf(tool)}
                      name={tool.title}
                      summary={tool.summary}
                      href={libraryHref(tool.name, tool.pilot)}
                      onNavigate={go}
                      meta={<Tags tool={tool} />}
                      footer={
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => add(tool)}
                          disabled={adding !== undefined}
                        >
                          {adding === keyOf(tool) ? "Adding…" : "Add"}
                        </Button>
                      }
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No available tool matches"
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

/**
 * A channel other than production says so, with its name or its branch (D-125); a tool still waiting
 * for the person says that too.
 */
function Tags({ tool }: { tool: LibraryTool }) {
  if (!tool.pilot && !tool.needsSetup) return null;
  return (
    <>
      {tool.pilot ? <Badge tone="strong">{channelLabel(tool.pilot)}</Badge> : null}
      {tool.needsSetup ? <Badge tone="warning">Setup to finish</Badge> : null}
    </>
  );
}

const navigate = (go: (href: string) => void) => (event: React.MouseEvent<HTMLAnchorElement>) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  go(event.currentTarget.getAttribute("href") ?? "/");
};

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
