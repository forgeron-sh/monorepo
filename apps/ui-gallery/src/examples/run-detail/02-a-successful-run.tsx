import { GitForkIcon, Invoice01Icon, Mail01Icon, TrophyIcon } from "@forgeron/icons";
import { RunDetail } from "@forgeron/ui";

export default function ASuccessfulRun() {
  const deal = { id: 4182, name: "Transalp", amount: 9600 };
  return (
    <div style={{ width: "100%", maxWidth: 820 }}>
      <RunDetail
        run={{
          id: "1212",
          status: "success",
          at: "2026-11-18 10:42:07",
          durationMs: 612,
          trigger: { label: "Deal moved to Won", icon: TrophyIcon },
        }}
        steps={[
          {
            id: "t",
            name: "Deal moved to Won",
            icon: TrophyIcon,
            status: "success",
            startMs: 0,
            durationMs: 4,
            items: 1,
            output: deal,
          },
          {
            id: "if",
            name: "Above €5,000?",
            icon: GitForkIcon,
            status: "success",
            startMs: 4,
            durationMs: 1,
            items: 1,
            input: deal,
            output: { branch: "true", deal },
          },
          {
            id: "inv",
            name: "Draft the invoice",
            icon: Invoice01Icon,
            status: "success",
            startMs: 5,
            durationMs: 322,
            items: 1,
            input: deal,
            output: { invoice: "INV-2026-0912", total: 11520 },
          },
          {
            id: "mail",
            name: "Send it",
            icon: Mail01Icon,
            status: "success",
            startMs: 327,
            durationMs: 284,
            items: 1,
            output: { messageId: "<4182@relay>" },
          },
        ]}
      />
    </div>
  );
}
