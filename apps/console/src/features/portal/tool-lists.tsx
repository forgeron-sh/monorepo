import "./portal.css";
import { Badge, Button, EmptyState, Field, Input, Notice, Page, ToolCard } from "@forgeron/ui";
import { useState, type MouseEvent } from "react";
import { explain, type Api } from "../../api";
import { pathOf } from "../../router";
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

// The person's own space (D-117, D-128): My tools, the tools they added, and Discover, the tools the
// workspace makes available to them that they have not added. Both read the same library; nothing on
// them is technical: no version, role or interface.

export interface LibraryPageProps {
  ws: WorkspaceInfo;
  api: Api;
  go: (href: string) => void;
}

/** A tool and its channel, when it is not production: one card each. */
export const keyOf = (t: LibraryTool) => (t.pilot ? `${t.name}@${t.pilot}` : t.name);

const matches = (tool: LibraryTool, query: string) =>
  `${tool.name} ${tool.title} ${tool.summary}`.toLowerCase().includes(query.trim().toLowerCase());

/** A plain click on a link moves in the page; a modified one is the browser's. */
export const navigate = (go: (href: string) => void) => (event: MouseEvent<HTMLAnchorElement>) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  go(event.currentTarget.getAttribute("href") ?? "/");
};

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

/** A tool the person added: _Use_ opens its page, or _Finish setup_ while it still asks for something. */
export function MyToolCard({ tool, go }: { tool: LibraryTool; go: (href: string) => void }) {
  const href = libraryHref(tool.name, tool.pilot);
  return (
    <ToolCard
      name={tool.title}
      summary={tool.summary}
      href={href}
      onNavigate={go}
      meta={<Tags tool={tool} />}
      footer={
        <Button size="sm" href={href} onClick={navigate(go)}>
          {tool.needsSetup ? "Finish setup" : "Use"}
        </Button>
      }
    />
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="fp-search">
      <Field label="Search tools">
        {(control) => (
          <Input
            {...control}
            type="search"
            value={value}
            placeholder="Name or what it does"
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </Field>
    </div>
  );
}

/** `/library`: the tools the person added. */
export function MyToolsPage({ ws, api, go }: LibraryPageProps) {
  const library = useLoad(() => loadLibrary(api.fetchJson), [api]);
  const [query, setQuery] = useState("");
  const tools = (library.data ?? []).filter((t) => t.installed);
  const shown = tools.filter((t) => matches(t, query));
  const available = (library.data ?? []).filter((t) => !t.installed).length;
  return (
    <Page title="My tools" description="The tools you added. Open one to use it.">
      {library.loading ? (
        <Loading shape="cards" label="Loading your tools" />
      ) : library.error && !library.data ? (
        <LoadError what="Your tools" error={library.error} onRetry={library.reload} />
      ) : tools.length === 0 ? (
        <EmptyState
          title="You have no tool yet"
          description={
            available > 0
              ? "Add one of the tools your workspace offers you: it takes a click."
              : ws.person.admin
                ? "Install a tool from the Marketplace, then choose who can use it."
                : "No tool is available to you yet. Ask an admin of this workspace."
          }
          {...(available > 0
            ? {
                action: (
                  <Button variant="primary" href={pathOf("discover")} onClick={navigate(go)}>
                    Discover tools
                  </Button>
                ),
              }
            : {})}
        />
      ) : (
        <section aria-labelledby="my-tools">
          <h2 id="my-tools" className="fg-visually-hidden">
            My tools
          </h2>
          <SearchField value={query} onChange={setQuery} />
          {shown.length > 0 ? (
            <ul className="fp-grid">
              {shown.map((tool) => (
                <MyToolCard key={keyOf(tool)} tool={tool} go={go} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No tool of yours matches"
              description={`Nothing matches "${query.trim()}".`}
            />
          )}
        </section>
      )}
    </Page>
  );
}

/** `/discover`: the tools the workspace makes available to the person, to add with a click. */
export function DiscoverPage({ ws, api, go }: LibraryPageProps) {
  const library = useLoad(() => loadLibrary(api.fetchJson), [api]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string>();
  const [error, setError] = useState<string>();
  const tools = (library.data ?? []).filter((t) => !t.installed);
  const shown = tools.filter((t) => matches(t, query));

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
      title="Discover"
      description="The tools your workspace makes available to you. Add one to start using it."
    >
      {library.loading ? (
        <Loading shape="cards" label="Loading the tools you can add" />
      ) : library.error && !library.data ? (
        <LoadError what="The tools you can add" error={library.error} onRetry={library.reload} />
      ) : tools.length === 0 ? (
        <EmptyState
          title="Nothing new to add"
          description={
            ws.person.admin
              ? "Every tool open to you is in My tools. Install more from the Marketplace, then choose who can use them."
              : "Every tool open to you is in My tools. Ask an admin when you need another one."
          }
          action={
            <Button href={pathOf("myTools")} onClick={navigate(go)}>
              Open my tools
            </Button>
          }
        />
      ) : (
        <section aria-labelledby="available">
          <h2 id="available" className="fg-visually-hidden">
            Available to you
          </h2>
          <SearchField value={query} onChange={setQuery} />
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {shown.length > 0 ? (
            <ul className="fp-grid">
              {shown.map((tool) => (
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
      )}
    </Page>
  );
}
