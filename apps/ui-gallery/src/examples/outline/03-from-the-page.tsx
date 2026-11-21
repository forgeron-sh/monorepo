// No list: the outline reads the headings of the element and follows it as you edit.
import { Outline } from "@forgeron/ui";
import { useState } from "react";

export default function FromThePage() {
  const [extra, setExtra] = useState(false);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 200px",
        gap: 24,
        width: "100%",
      }}
    >
      <article
        id="ol-article"
        style={{
          height: 260,
          overflow: "auto",
          paddingRight: 12,
          font: "400 14px/20px var(--font-sans)",
          color: "var(--ink-muted)",
        }}
      >
        <h2 style={{ color: "var(--ink)", font: "500 16px/22px var(--font-sans)" }}>Overview</h2>
        <p style={{ height: 120 }}>The first section.</p>
        <h3 style={{ color: "var(--ink)", font: "500 14px/20px var(--font-sans)" }}>Details</h3>
        <p style={{ height: 120 }}>Its details.</p>
        {extra ? (
          <>
            <h2 style={{ color: "var(--ink)", font: "500 16px/22px var(--font-sans)" }}>
              Appendix
            </h2>
            <p style={{ height: 200 }}>Added a moment ago.</p>
          </>
        ) : null}
        <h2 style={{ color: "var(--ink)", font: "500 16px/22px var(--font-sans)" }}>Summary</h2>
        <p style={{ height: 160 }}>The end.</p>
      </article>
      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <Outline from="#ol-article" scrollRoot="#ol-article" offset={24} foldable />
        <button type="button" className="fg-btn fg-btn-sm" onClick={() => setExtra((v) => !v)}>
          {extra ? "Remove a section" : "Add a section"}
        </button>
      </div>
    </div>
  );
}
