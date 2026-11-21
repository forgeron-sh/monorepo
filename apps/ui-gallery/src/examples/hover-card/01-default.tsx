import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from "@forgeron/ui";

export default function Default() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" asChild>
          <a href="#forgeron">@forgeron</a>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <strong>Forgeron</strong>
        <p style={{ margin: "4px 0 0", color: "var(--ink-muted)" }}>
          The SDK, the runtime and the platform for internal tools.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
