import { Mail01Icon, Message01Icon, TrophyIcon } from "@forgeron/icons";
import { StepCard } from "@forgeron/ui";

export default function States() {
  return (
    <div style={{ display: "grid", gap: 16, width: 320, paddingTop: 10 }}>
      <StepCard
        kind="trigger"
        icon={TrophyIcon}
        title="Deal moved to Won"
        subtitle="CRM · onDealWon()"
        status="success"
        meta="12 ms · 1 item"
      />
      <StepCard
        icon={Mail01Icon}
        title="Send the invoice"
        subtitle="Mail relay · send()"
        status="error"
        error="Mail relay answered 503"
      />
      <StepCard icon={Message01Icon} title="Tell #sales" subtitle="Chat · postMessage()" />
    </div>
  );
}
