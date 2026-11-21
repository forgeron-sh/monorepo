// A still picture of the open card for the grids: the card lives in a portal, after hover.

export default function HoverCardThumbnail() {
  return (
    <div className="thumb">
      <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
        <span style={{ color: "var(--accent)", font: "500 13px/18px var(--font-sans)" }}>
          @forgeron
        </span>
        <div className="fg-pop fg-hover-card" role="presentation">
          <strong>Forgeron</strong>
          <p style={{ margin: "4px 0 0", color: "var(--ink-muted)" }}>
            The SDK, the runtime and the platform for internal tools.
          </p>
        </div>
      </div>
    </div>
  );
}
