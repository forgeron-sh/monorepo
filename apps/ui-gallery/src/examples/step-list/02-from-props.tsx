import { GitForkIcon, Mail01Icon, Message01Icon, TrophyIcon } from "@forgeron/icons";
import { StepList } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 340, paddingTop: 10 }}>
      <StepList
        readOnly
        defaultSteps={[
          {
            id: "t",
            kind: "trigger",
            icon: TrophyIcon,
            title: "Deal moved to Won",
            subtitle: "CRM · onDealWon()",
          },
          {
            id: "if",
            kind: "logic",
            icon: GitForkIcon,
            title: "Above €5,000?",
            subtitle: "Flows · ifElse()",
          },
          {
            id: "chat",
            icon: Message01Icon,
            title: "Tell #sales",
            subtitle: "Chat · postMessage()",
          },
          {
            id: "mail",
            icon: Mail01Icon,
            title: "Thank the client",
            subtitle: "Mail relay · send()",
          },
        ]}
      />
    </div>
  );
}
