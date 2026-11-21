import { MetricPicker } from "@forgeron/ui";
import { UserIcon, Flag01Icon } from "@forgeron/icons";

export default function WithFilters() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <MetricPicker
        measures={[{ id: "deals", label: "Deals", aggregations: ["count"] }]}
        groupings={[{ id: "stage", label: "Stage" }]}
        defaultValue={{
          measure: "deals",
          aggregation: "count",
          groupBy: "stage",
          interval: "month",
          filters: [{ field: "stage", operator: "is-not", values: ["lost"] }],
        }}
        fields={[
          {
            id: "stage",
            label: "Stage",
            icon: Flag01Icon,
            options: [
              { value: "won", label: "Won" },
              { value: "open", label: "Open" },
              { value: "lost", label: "Lost" },
            ],
          },
          {
            id: "owner",
            label: "Owner",
            icon: UserIcon,
            options: [
              { value: "ana", label: "Ana" },
              { value: "bo", label: "Bo" },
            ],
          },
        ]}
      />
    </div>
  );
}
