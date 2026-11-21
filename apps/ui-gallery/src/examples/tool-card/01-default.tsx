import {
  Badge,
  Button,
  ToolCard,
  ToolCardDescription,
  ToolCardFooter,
  ToolCardHeader,
  ToolCardHeading,
  ToolCardIcon,
  ToolCardLink,
  ToolCardMeta,
  ToolCardTitle,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <ul style={{ width: 300, margin: 0, padding: 0 }}>
      <ToolCard>
        <ToolCardHeader>
          <ToolCardIcon name="Contracts" />
          <ToolCardHeading>
            <ToolCardTitle>
              <ToolCardLink href="#/tools/contracts" onNavigate={() => {}}>
                Contracts
              </ToolCardLink>
            </ToolCardTitle>
            <ToolCardMeta>
              <Badge mono>2.1.0</Badge>
            </ToolCardMeta>
          </ToolCardHeading>
        </ToolCardHeader>
        <ToolCardDescription>Drafts, signs and files the contracts of a team.</ToolCardDescription>
        <ToolCardFooter>
          <Button size="sm">Open</Button>
        </ToolCardFooter>
      </ToolCard>
    </ul>
  );
}
