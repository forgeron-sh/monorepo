import "@forgeron/ui/styles.css";
import "../console.css";
import "../features/portal/portal.css";
import {
  Badge,
  CopyBlock,
  DetailList,
  EmptyState,
  Markdown,
  ToolCard,
  ToolIcon,
} from "@forgeron/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { imagesOf } from "../features/portal/catalog";
import { MOCK_README, MOCK_TOOLS, mockToolCard } from "../features/portal/mock";

// The design system preview of the member space: every presentational component with fixed fake data,
// including a hostile README that must stay inert. Served by `vite` (the harness) at `/preview.html`;
// a build does not carry it. Pick the theme with `?theme=light`.
const theme = new URLSearchParams(location.search).get("theme");
if (theme === "light") document.documentElement.dataset.theme = "light";

function Preview() {
  return (
    <main className="fg-page">
      <h1 className="fg-page-title">Member space components</h1>

      <section className="fc-section">
        <h2 className="fc-section-title">ToolCard and ToolIcon</h2>
        <ul className="fp-grid">
          {MOCK_TOOLS.map((tool) => (
            <ToolCard
              key={tool.name}
              name={tool.name}
              summary={tool.summary}
              href={`/tools/${tool.name}`}
              meta={<Badge mono>{tool.productionVersion ?? "not deployed"}</Badge>}
              footer={<Badge>{tool.access}</Badge>}
            />
          ))}
        </ul>
        <p>
          <ToolIcon name="crm" /> <ToolIcon name="odoo" size="lg" />
        </p>
      </section>

      <section className="fc-section">
        <h2 className="fc-section-title">DetailList, CopyBlock, EmptyState</h2>
        <DetailList
          items={[
            { label: "Version", value: <span className="fc-mono">1.4.0</span> },
            { label: "Interfaces", value: <Badge mono>MCP</Badge> },
          ]}
        />
        <p />
        <CopyBlock label="Sign in from your terminal" value="forgeron login" prefix="$" />
        <p />
        <EmptyState
          title="You do not use a tool yet"
          description="Ask an admin which tools you can use."
        />
      </section>

      <section className="fc-section">
        <h2 className="fc-section-title">
          Markdown: a README with images, a table, code, a task list and hostile content
        </h2>
        <Markdown source={MOCK_README} images={imagesOf(mockToolCard("crm")!)} />
      </section>
    </main>
  );
}

// `?page=home&mock=member` and `?page=card&tool=crm&mock=member` draw the real screens on the mock
// gateway, until they are reached through the shell's routes.
async function start() {
  const params = new URLSearchParams(location.search);
  const page = params.get("page");
  let view = <Preview />;
  if (page) {
    await (await import("../mock/install")).installMock();
    const { fetchJson, sendJson } = await import("../api");
    const api = { fetchJson, sendJson };
    const ws = await (await import("../workspace")).loadWorkspace(fetchJson);
    if (page === "home") {
      const { PortalHome } = await import("../features/portal/home");
      view = <PortalHome ws={ws} api={api} go={(href) => history.pushState(null, "", href)} />;
    } else {
      const { default: ToolOverview } = await import("../features/portal/tool-card");
      view = (
        <main className="fg-page">
          <ToolOverview tool={params.get("tool") ?? "crm"} ws={ws} api={api} />
        </main>
      );
    }
  }
  createRoot(document.getElementById("root")!).render(<StrictMode>{view}</StrictMode>);
}
void start();
