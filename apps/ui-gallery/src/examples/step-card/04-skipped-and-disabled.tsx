import { Database01Icon, SparklesIcon } from "@forgeron/icons";
import { StepCard } from "@forgeron/ui";

export default function SkippedAndDisabled() {
  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 420 }}>
      <StepCard
        icon={Database01Icon}
        title="Log the deal"
        subtitle="Data hub · insert()"
        status="skipped"
      />
      <StepCard
        icon={SparklesIcon}
        title="Summarise the thread"
        subtitle="AI Gateway · complete()"
        disabled
      />
    </div>
  );
}
