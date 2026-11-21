import { GitForkIcon, Invoice01Icon, Mail01Icon, Message01Icon, TrophyIcon } from "@forgeron/icons";
import { StepList } from "@forgeron/ui";

// A run replayed on the list: each step with its state, the branch not taken is not reached.
export default function AFailedRun() {
  return (
    <div style={{ width: "100%", maxWidth: 640, paddingTop: 10 }}>
      <StepList
        readOnly
        defaultSteps={[
          {
            id: "t",
            kind: "trigger",
            icon: TrophyIcon,
            title: "Deal moved to Won",
            status: "success",
            meta: "4 ms · 1 item",
          },
          {
            id: "if",
            kind: "logic",
            icon: GitForkIcon,
            title: "Above €5,000?",
            status: "success",
            meta: "1 ms · true",
            branches: [
              {
                id: "y",
                label: "true",
                steps: [
                  {
                    id: "inv",
                    icon: Invoice01Icon,
                    title: "Draft the invoice",
                    status: "success",
                    meta: "310 ms · 1 item",
                  },
                  {
                    id: "mail",
                    icon: Mail01Icon,
                    title: "Send it",
                    status: "error",
                    error: "Mail relay answered 503 three times",
                  },
                ],
              },
              {
                id: "n",
                label: "false",
                steps: [
                  { id: "chat", icon: Message01Icon, title: "Tell #sales", status: "skipped" },
                ],
              },
            ],
          },
        ]}
      />
    </div>
  );
}
