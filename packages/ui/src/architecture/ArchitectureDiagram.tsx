import type { Manifest } from "@forgeron/manifest";
import { useId, useMemo, useState } from "react";
import { cx } from "../cx";
import { layoutArchitecture, type DiagramLayout, type DiagramNode } from "./layout";

export interface ArchitectureDiagramProps {
  manifest: Manifest;
  className?: string;
}

const KIND_LABELS: Record<DiagramNode["kind"], string> = {
  interface: "Interface",
  group: "Actions",
  database: "Database",
  files: "Files",
  cache: "Cache",
  queue: "Queue",
  secret: "Secret",
  "user-secret": "Personal secret",
  connector: "Connector",
  host: "Outbound host",
  role: "Role",
  event: "Event",
  task: "Task",
  tool: "Tool",
};

function Node({ node }: { node: DiagramNode }) {
  const pad = 12;
  return (
    <g
      className={cx("fg-arch-node", `fg-arch-${node.kind}`, node.off && "fg-arch-off")}
      tabIndex={0}
      role="img"
      aria-label={node.text}
      transform={`translate(${node.x} ${node.y})`}
    >
      <rect width={node.width} height={node.height} />
      {node.rows ? (
        <>
          <text className="fg-arch-title" x={pad} y={21}>
            {node.title}
          </text>
          <text className="fg-arch-sub" x={node.width - pad} y={21} textAnchor="end">
            {node.subtitle}
          </text>
          <line className="fg-arch-rule" x1={0} x2={node.width} y1={34} y2={34} />
          {node.rows.map((row, index) => (
            <g key={index} transform={`translate(0 ${34 + index * 22})`}>
              <text className="fg-arch-row" x={pad} y={16}>
                {row.label}
              </text>
              <text
                className={cx("fg-arch-level", `fg-arch-level-${levelClass(row.access)}`)}
                x={node.width - pad}
                y={16}
                textAnchor="end"
              >
                {row.access}
              </text>
            </g>
          ))}
        </>
      ) : (
        <>
          {node.kind === "interface" ? null : (
            <text className="fg-arch-kind" x={pad} y={18}>
              {KIND_LABELS[node.kind]}
            </text>
          )}
          <text className="fg-arch-title" x={pad} y={node.kind === "interface" ? 24 : 36}>
            {node.title}
          </text>
          {node.subtitle ? (
            <text className="fg-arch-sub" x={pad} y={node.kind === "interface" ? 42 : 52}>
              {node.subtitle}
            </text>
          ) : null}
        </>
      )}
    </g>
  );
}

// The levels are told apart by the word; the weight follows how much they allow.
const levelClass = (access: string) =>
  access === "read" ? "read" : access === "write" ? "write" : "strong";

function Diagram({ layout, name }: { layout: DiagramLayout; name: string }) {
  return (
    <svg
      className="fg-arch-svg"
      viewBox={`-1 -1 ${layout.width + 2} ${layout.height + 2}`}
      role="group"
      aria-label={`Architecture of ${name}`}
    >
      {layout.sections.map((section) => (
        <text key={section.id} className="fg-arch-section" x={section.x} y={section.y + 14}>
          {section.title}
        </text>
      ))}
      {layout.edges.map((edge) => (
        <polyline
          key={edge.id}
          className="fg-arch-edge"
          points={edge.points.map((p) => p.join(",")).join(" ")}
          aria-hidden="true"
        />
      ))}
      {layout.nodes.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </svg>
  );
}

function List({ layout, id }: { layout: DiagramLayout; id: string }) {
  const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
  return (
    <div className="fg-arch-list" id={id}>
      {layout.sections.map((section) => (
        <section key={section.id}>
          <h3>{section.title}</h3>
          <ul>
            {section.nodes.map((nodeId) => (
              <li key={nodeId}>{nodes.get(nodeId)!.text}</li>
            ))}
          </ul>
        </section>
      ))}
      {layout.edges.length > 0 ? (
        <section>
          <h3>Connections</h3>
          <ul>
            {layout.edges.map((edge) => (
              <li key={edge.id}>{edge.text}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/**
 * The architecture of a tool, drawn from its manifest: interfaces, action groups with their access
 * level, resources, roles, events, tasks and the tools it uses. A static SVG that scales to its
 * container; every node can be focused and reads as a sentence. A text list says the same, and takes
 * the diagram's place when the container is narrow.
 */
export function ArchitectureDiagram({ manifest, className }: ArchitectureDiagramProps) {
  const layout = useMemo(() => layoutArchitecture(manifest), [manifest]);
  const [listOpen, setListOpen] = useState(false);
  const listId = useId();
  const name = manifest.title ?? manifest.name;
  return (
    <div className={cx("fg-arch", listOpen && "fg-arch-list-open", className)}>
      <div className="fg-arch-bar">
        <button
          type="button"
          className="fg-btn fg-btn-secondary fg-btn-sm fg-arch-toggle"
          aria-expanded={listOpen}
          aria-controls={listId}
          onClick={() => setListOpen((open) => !open)}
        >
          {listOpen ? "Hide the list" : "Show as a list"}
        </button>
      </div>
      <Diagram layout={layout} name={name} />
      <List layout={layout} id={listId} />
    </div>
  );
}
