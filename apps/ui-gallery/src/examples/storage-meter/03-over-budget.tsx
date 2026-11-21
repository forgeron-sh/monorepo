// Past the budget the bar turns to danger and says so in words; the legend keeps the parts apart.
import { Chip, StorageMeter } from "@forgeron/ui";

export default function OverBudget() {
  return (
    <div style={{ display: "grid", gap: 24, width: 280 }}>
      <StorageMeter
        label="Storage"
        quota={50e9}
        action={<Chip>R2</Chip>}
        parts={[
          { label: "My files", bytes: 18e9 },
          { label: "Team drives", bytes: 34e9 },
        ]}
      />
      <StorageMeter
        label="Mailbox"
        quota={15e9}
        cells={24}
        parts={[{ label: "Mail", bytes: 6.2e9, tone: "ink" }]}
      />
    </div>
  );
}
