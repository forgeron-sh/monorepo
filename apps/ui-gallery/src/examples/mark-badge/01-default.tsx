import { MarkBadge } from "@forgeron/ui";

// A pixel Y on an ember square, in the page's one orange with black on it.
const mark = (
  <svg viewBox="0 0 9 11" shapeRendering="crispEdges" aria-hidden="true">
    <rect width="9" height="11" style={{ fill: "var(--accent)" }} />
    <path
      style={{ fill: "var(--accent-ink)" }}
      d="M2 2h1v1h-1zM6 2h1v1h-1zM2 3h1v1h-1zM6 3h1v1h-1zM3 4h1v1h-1zM5 4h1v1h-1zM4 5h1v4h-1z"
    />
  </svg>
);

export default function Default() {
  return <MarkBadge mark={mark}>Not backed by Y Combinator</MarkBadge>;
}
