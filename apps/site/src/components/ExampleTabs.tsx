import { Badge, EnvTag, Label } from "@forgeron/ui";
import { useState } from "react";
import { examples } from "../data/examples";
import { CodeCard } from "./CodeCard";

/** Swappable tool examples. Rendered at build time, hydrated on the client for the tabs. */
export function ExampleTabs() {
  const [current, setCurrent] = useState(examples[0]?.id);
  const example = examples.find((e) => e.id === current) ?? examples[0];
  if (!example) return null;

  return (
    <div>
      <div role="tablist" aria-label="Tool examples" className="tabs">
        {examples.map((e) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            id={`tab-${e.id}`}
            aria-selected={e.id === current}
            aria-controls="example"
            className={e.id === current ? "tab tab-on" : "tab"}
            onClick={() => setCurrent(e.id)}
          >
            {e.label}
          </button>
        ))}
      </div>
      <div
        className="frame frame-pad"
        id="example"
        role="tabpanel"
        aria-labelledby={`tab-${example.id}`}
      >
        <span className="h tl" />
        <span className="h tr" />
        <span className="h bl" />
        <span className="h br" />
        <div className="example-grid">
          <div className="example-code">
            <CodeCard title={example.file} meta="TypeScript" lines={example.code} />
          </div>
          <div className="example-side">
            <div className="card pad stack-3">
              <Label>Exposed actions</Label>
              {example.actions.map((a) => (
                <div className="action-row" key={a.name}>
                  <span className="text-code-inline">{a.name}</span>
                  <Badge mono>{a.access}</Badge>
                </div>
              ))}
            </div>
            <div className="card pad stack-3">
              <Label>Interfaces</Label>
              <div className="row-wrap">
                {example.interfaces.map((i) => (
                  <Badge mono key={i}>
                    {i}
                  </Badge>
                ))}
              </div>
              <span className="text-small muted">{example.interfaceNote}</span>
            </div>
            <div className="card pad-row">
              <span className="text-code-inline">{example.version}</span>
              <EnvTag env="production" />
              <Badge tone="success" dot>
                Live
              </Badge>
            </div>
          </div>
        </div>
        <div className="card sunken terminal">
          <div className="card-head text-code">
            <span>terminal</span>
            <span>Every action becomes a command</span>
          </div>
          <pre className="text-code term-body">
            <span className="muted">$ </span>
            {example.cli}
            {example.output.map((o) => (
              <span className="muted line-block" key={o}>
                {o}
              </span>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
