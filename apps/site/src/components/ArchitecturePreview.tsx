import { ArchitectureDiagram, Button } from "@forgeron/ui";
import { crm, dashboard, inventory, odooGateway } from "@forgeron/ui/architecture-fixtures";
import { useEffect, useState } from "react";

const templates = [
  { id: "crm", label: "CRM", manifest: crm },
  { id: "dashboard", label: "Dashboard", manifest: dashboard },
  { id: "inventory", label: "Inventory", manifest: inventory },
  { id: "odoo-gateway", label: "Odoo gateway", manifest: odooGateway },
];

/** The architecture diagram on the manifests of the four templates, in either theme. */
export function ArchitecturePreview() {
  const [current, setCurrent] = useState(templates[0]!.id);
  const [light, setLight] = useState(false);
  const template = templates.find((t) => t.id === current) ?? templates[0]!;

  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light]);

  return (
    <div>
      <div className="arch-controls">
        <div role="tablist" aria-label="Templates" className="tabs">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`arch-tab-${t.id}`}
              aria-selected={t.id === current}
              aria-controls="arch-panel"
              className={t.id === current ? "tab tab-on" : "tab"}
              onClick={() => setCurrent(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button size="sm" aria-pressed={light} onClick={() => setLight((v) => !v)}>
          {light ? "Atelier (light)" : "Forge (dark)"}
        </Button>
      </div>
      <div
        id="arch-panel"
        role="tabpanel"
        aria-labelledby={`arch-tab-${template.id}`}
        className="arch-panel"
      >
        <ArchitectureDiagram manifest={template.manifest} />
      </div>
    </div>
  );
}
