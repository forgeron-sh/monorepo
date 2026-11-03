import { Button, Notice, Page, Tabs } from "@forgeron/ui";
import { createElement, lazy, Suspense, useMemo, useState, type ComponentType } from "react";
import type { Api } from "../../../api";
import { pathOf } from "../../../router";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import { loadTools } from "../api";
import { ToolIcon } from "../components";
import "../register";
import { toolTabs, type ToolTab, type ToolTabProps } from "../tabs";
import "../tools.css";

// One tool: its header, then the tabs that features registered (`registerToolTab`). The tab is in
// the address (`?tab=branches`) so that a link opens it; the first one is the default.

const loaded = new Map<string, ComponentType<ToolTabProps>>();
const panel = (tab: ToolTab) => {
  let component = loaded.get(tab.id);
  if (!component) {
    component = lazy(tab.load);
    loaded.set(tab.id, component);
  }
  return component;
};

function askedTab(): string | null {
  return new URLSearchParams(window.location.search).get("tab");
}

export default function ToolPage({
  name,
  api,
  admin,
  now = () => new Date(),
}: {
  name: string;
  api: Api;
  admin: boolean;
  now?: () => Date;
}) {
  const tools = useLoad(() => loadTools(api.fetchJson), [api]);
  const tabs = useMemo(() => toolTabs(admin), [admin]);
  const [asked, setAsked] = useState(askedTab);
  const tool = tools.data?.find((t) => t.name === name);

  const select = (id: string) => {
    setAsked(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url);
  };

  if (tools.loading) {
    return (
      <Page title={name}>
        <Loading label="Loading the tool" />
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
          <h1 className="fg-page-title">{tool.name}</h1>
          {tool.summary ? <p className="fg-page-desc">{tool.summary}</p> : null}
        </div>
      </header>
      {current ? (
        <Tabs
          label="Tool sections"
          tabs={tabs.map((t) => ({ id: t.id, label: t.title }))}
          value={current.id}
          onChange={select}
        >
          <Suspense fallback={<Loading label={`Loading ${current.title}`} />}>
            {createElement(panel(current), {
              key: current.id,
              tool: tool.name,
              api,
              admin,
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
