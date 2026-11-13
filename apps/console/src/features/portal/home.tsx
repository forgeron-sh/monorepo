import "./portal.css";
import { Button, EmptyState, Page, Stat } from "@forgeron/ui";
import type { Api } from "../../api";
import { FirstRun, firstRunSteps } from "../../overview";
import { pathOf } from "../../router";
import { can } from "../../shell/access";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import type { WorkspaceInfo } from "../../workspace";
import { loadLibrary } from "./library";
import { keyOf, MyToolCard, navigate } from "./tool-lists";

// Home (D-128): where the person starts. Their tools first, to open one at once; then how many tools
// they can still add, which Discover lists. Whoever sees members also sees the workspace's numbers
// (and the first-run checklist until it is done). The full lists are My tools and Discover; Home only
// leads to them. Nothing technical: no version or interface.

export interface PortalHomeProps {
  ws: WorkspaceInfo;
  api: Api;
  go: (href: string) => void;
}

/** How many of the person's tools Home shows before "All my tools". */
const ON_HOME = 6;

export function PortalHome({ ws, api, go }: PortalHomeProps) {
  const library = useLoad(() => loadLibrary(api.fetchJson), [api]);
  const tools = library.data ?? [];
  const mine = tools.filter((t) => t.installed);
  const available = tools.filter((t) => !t.installed).length;
  const sees = can(ws.person, "members:read");
  const gives = can(ws.person, "access:write");

  return (
    <Page
      title="Home"
      description={
        sees ? (
          <>
            Workspace <span className="fc-mono">{ws.workspace}</span>
          </>
        ) : (
          "Your tools, and the ones you can add."
        )
      }
    >
      {sees ? <AdminStrip ws={ws} api={api} go={go} /> : null}

      {library.loading ? (
        <Loading shape="cards" label="Loading your tools" />
      ) : library.error && !library.data ? (
        <LoadError what="Your tools" error={library.error} onRetry={library.reload} />
      ) : (
        <>
          <section className="fc-section" aria-labelledby="my-tools">
            <div className="fc-section-head">
              <h2 id="my-tools" className="fc-section-title">
                My tools
              </h2>
              {mine.length > 0 ? (
                <Button size="sm" variant="ghost" href={pathOf("myTools")} onClick={navigate(go)}>
                  {mine.length > ON_HOME ? `All my tools (${mine.length})` : "All my tools"}
                </Button>
              ) : null}
            </div>
            {mine.length > 0 ? (
              <ul className="fp-grid">
                {mine.slice(0, ON_HOME).map((tool) => (
                  <MyToolCard key={keyOf(tool)} tool={tool} go={go} />
                ))}
              </ul>
            ) : (
              <EmptyState
                title="You have no tool yet"
                description={
                  available > 0
                    ? "Add one of the tools your workspace offers you: it takes a click."
                    : gives
                      ? "Install a tool from the Marketplace, then choose who can use it."
                      : "No tool is available to you yet. Ask someone who gives access to share one with your team."
                }
              />
            )}
          </section>

          {available > 0 ? (
            <section className="fc-section" aria-labelledby="available">
              <div className="fc-section-head">
                <h2 id="available" className="fc-section-title">
                  To discover
                </h2>
              </div>
              <div className="fp-discover">
                <p>
                  {available === 1
                    ? "1 tool is available to you and not in your tools yet."
                    : `${available} tools are available to you and not in your tools yet.`}
                </p>
                <Button
                  variant={mine.length > 0 ? "secondary" : "primary"}
                  href={pathOf("discover")}
                  onClick={navigate(go)}
                >
                  Discover tools
                </Button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </Page>
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
          {can(ws.person, "members:write") ? (
            <Button size="sm" variant="ghost" href={pathOf("invite")} onClick={navigate(go)}>
              Invite people
            </Button>
          ) : null}
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
