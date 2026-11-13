import { Badge, Button, Notice, Page, Select, Tabs } from "@forgeron/ui";
import {
  createElement,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import type { PageProps } from "../../../shell/page-props";
import { pathOf, toolPath } from "../../../router";
import { can } from "../../../shell/access";
import { hrefOf } from "../../../shell/href";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadTools } from "../api";
import { ToolIcon } from "../components";
import { PublishBadge, PublishControl, usePublishing } from "../publish";
import "../register";
import { toolTabs, type ToolTab, type ToolTabProps } from "../tabs";
import "../tools.css";

// One tool: its header, then the tabs that features registered (`registerToolTab`). The tab is in
// the address (`?tab=branches`) so that a link opens it; the first one is the default.
//
// The page shows production at `/admin/tools/<tool>` and another channel at
// `/admin/tools/<tool>/tree/<ref>` (D-120, D-125, D-128): a branch's temporary channel by its branch, a permanent channel by `~<name>`. It is
// chosen at the right of the header. A tab whose scope is the channel follows it; a tab that is the
// same for every channel says so. A channel that is gone sends the page back to production, with a
// word about it.

const loaded = new Map<string, ComponentType<ToolTabProps>>();
const panel = (tab: ToolTab) => {
  let component = loaded.get(tab.id);
  if (!component) {
    component = lazy(tab.load);
    loaded.set(tab.id, component);
  }
  return component;
};

/** Tabs that are gone: their address opens the tool page (D-129: who may use it is in the header). */
const GONE_TABS = new Set(["availability"]);

function askedTab(): string | null {
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === null || !GONE_TABS.has(tab)) return tab;
  const url = new URL(window.location.href);
  url.searchParams.delete("tab");
  window.history.replaceState(null, "", url);
  return null;
}

/** The address of the tool on a branch, keeping the open tab. */
const addressOf = (name: string, branch: string | undefined) =>
  toolPath(name, branch) + window.location.search;

export default function ToolPage({
  name,
  branch: askedBranch,
  api,
  ws,
  now,
  go,
}: PageProps & { name: string; branch?: string }) {
  // Sharing a channel is for whoever publishes (D-136).
  const mayPublish = can(ws.person, "tools:publish");
  const tools = useLoad(() => loadTools(api.fetchJson), [api]);
  const tabs = useMemo(() => toolTabs(ws.person), [ws.person]);
  const [asked, setAsked] = useState(askedTab);
  const tool = tools.data?.find((t) => t.name === name);
  const previews = tool?.previews.map((p) => p.branch) ?? [];
  const channels = tool?.channels.map((c) => `~${c.channel}`) ?? [];
  // A channel that is gone (closed, removed, or a mistyped address) is not shown: the page is production's.
  const gone =
    askedBranch !== undefined &&
    tool !== undefined &&
    !previews.includes(askedBranch) &&
    !channels.includes(askedBranch);
  const branch = gone ? undefined : askedBranch;
  const publishing = usePublishing(api, name, branch, mayPublish && tool !== undefined);
  useEffect(() => {
    if (gone) window.history.replaceState(null, "", addressOf(name, undefined));
  }, [gone, name]);

  const select = (id: string) => {
    setAsked(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  };

  if (tools.loading) {
    return (
      <Page title={name}>
        <Loading shape="page" label="Loading the tool" />
      </Page>
    );
  }
  if (!tools.data) {
    return (
      <Page title={name}>
        <LoadError what="The tool" error={tools.error} onRetry={tools.reload} />
      </Page>
    );
  }
  if (!tool) {
    return (
      <Page title={name}>
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
      </Page>
    );
  }

  const current = tabs.find((t) => t.id === asked) ?? tabs[0];
  return (
    <main className="fg-page ft-page">
      <header className="ft-header">
        <ToolIcon name={tool.name} size={48} />
        <div className="ft-header-text">
          <div className="ft-header-title">
            <h1 className="fg-page-title">{tool.name}</h1>
            {mayPublish ? (
              <PublishBadge publishing={publishing} {...(branch !== undefined ? { branch } : {})} />
            ) : null}
          </div>
          {tool.summary ? <p className="fg-page-desc">{tool.summary}</p> : null}
        </div>
        <div className="ft-header-actions">
          <Select
            className="ft-channel-pick"
            aria-label="Channel"
            value={branch ?? ""}
            options={[
              {
                value: "",
                label: tool.production ? `Production · ${tool.production}` : "Production",
              },
              ...tool.channels.map((c) => ({
                value: `~${c.channel}`,
                label: `${c.channel} · ${c.version}`,
              })),
              ...previews.map((b) => ({ value: b, label: `Branch ${b}` })),
            ]}
            onChange={(e) => go(addressOf(tool.name, e.target.value || undefined))}
          />
          {mayPublish ? (
            <PublishControl
              key={branch ?? ""}
              tool={tool.name}
              {...(branch !== undefined ? { branch } : {})}
              api={api}
              publishing={publishing}
            />
          ) : null}
          <Button
            className="ft-open-mine"
            href={hrefOf("/library/:tool", { tool: tool.name })}
            aria-label={`Open ${tool.name} in my tools`}
            title="Open in my tools"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 11 11 5M6 5h5v5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Button>
        </div>
      </header>
      {gone ? (
        <Notice tone="warning" title={`The channel ${askedBranch} is gone.`}>
          This is production. Push the branch again, or add the channel again, to see it here.
        </Notice>
      ) : null}
      {branch !== undefined ? (
        <div className="ft-branch-band" role="status">
          <Badge tone="warning">{branch.startsWith("~") ? "Channel" : "Branch"}</Badge>
          <span className="ft-branch-band-text">
            You are looking at <code>{branch.startsWith("~") ? branch.slice(1) : branch}</code>. Its
            publication and what you change in Overview, Architecture, Database and Secrets are for
            this channel only, with its own data, never for production.
          </span>
          <Button size="sm" onClick={() => go(addressOf(tool.name, undefined))}>
            Back to production
          </Button>
        </div>
      ) : null}
      {current ? (
        <Tabs
          label="Tool sections"
          tabs={tabs.map((t) => ({ id: t.id, label: t.title }))}
          value={current.id}
          onChange={select}
        >
          {branch !== undefined && current.scope === "tool" ? (
            <p className="ft-shared">The same for every channel.</p>
          ) : null}
          <Suspense fallback={<Loading shape="block" label={`Loading ${current.title}`} />}>
            {createElement(panel(current), {
              key: `${current.id}@${current.scope === "branch" ? (branch ?? "") : ""}`,
              tool: tool.name,
              ...(branch !== undefined && current.scope === "branch" ? { branch } : {}),
              api,
              ws,
              now,
            })}
          </Suspense>
        </Tabs>
      ) : (
        <Notice tone="info" title="Nothing to show here.">
          This tool has no section you may open.
        </Notice>
      )}
    </main>
  );
}
