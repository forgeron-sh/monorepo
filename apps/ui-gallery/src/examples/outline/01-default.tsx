// A list of headings, with the one you are reading marked. Scroll the pane, or click a heading.
import { Outline } from "@forgeron/ui";

const headings = [
  { id: "ol-goals", text: "Goals", level: 1 },
  { id: "ol-scope", text: "Scope", level: 2 },
  { id: "ol-out", text: "Out of scope", level: 2 },
  { id: "ol-plan", text: "Plan", level: 1 },
  { id: "ol-q1", text: "First quarter", level: 2 },
  { id: "ol-q1a", text: "Hiring", level: 3 },
  { id: "ol-q2", text: "Second quarter", level: 2 },
  { id: "ol-risks", text: "Risks", level: 1 },
];

const filler = (n: number) => (
  <p style={{ margin: "0 0 12px", color: "var(--ink-muted)" }}>
    {"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(n)}
  </p>
);

export default function Default() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 200px",
        gap: 24,
        width: "100%",
      }}
    >
      <div
        id="ol-pane"
        tabIndex={0}
        aria-label="Document"
        style={{
          height: 280,
          overflow: "auto",
          paddingRight: 12,
          font: "400 14px/20px var(--font-sans)",
        }}
      >
        {headings.map((h) => {
          const Tag = `h${h.level}` as "h1";
          return (
            <section key={h.id}>
              <Tag
                id={h.id}
                style={{
                  margin: "0 0 8px",
                  font: "500 16px/22px var(--font-sans)",
                  color: "var(--ink)",
                }}
              >
                {h.text}
              </Tag>
              {filler(3)}
            </section>
          );
        })}
      </div>
      <Outline headings={headings} scrollRoot="#ol-pane" offset={24} />
    </div>
  );
}
