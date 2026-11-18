import { AnvilIcon, CloudflareIcon, LockIcon } from "@forgeron/icons";
import { Hero, MarkBadge } from "@forgeron/ui";

// A pixel Y on an ember square, as the badge above the title.
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
  return (
    <div className="fg-rail">
      <Hero
        badge={<MarkBadge mark={mark}>Not backed by Y Combinator</MarkBadge>}
        title={["Forge your", "internal tools."]}
        proof={[
          { icon: CloudflareIcon, text: "Cloudflare" },
          { icon: AnvilIcon, text: "Apache-2.0" },
          { icon: LockIcon, text: "Company SSO" },
        ]}
        lead="Pick a ready-made tool. Shape it to your team with AI. Ship it to your people and your agents."
        command="npx forgeron init"
        action={{ href: "#start", label: "Get started" }}
      />
    </div>
  );
}
