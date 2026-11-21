import { BarChart, WidgetFrame } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 440, height: 280 }}>
      <WidgetFrame
        title="Revenue by region"
        subtitle="Last 30 days"
        expandable
        menu={[
          { id: "refresh", label: "Refresh" },
          { id: "export", label: "Export CSV" },
          { separator: true },
          { id: "remove", label: "Remove", danger: true },
        ]}
        onMenuSelect={() => {}}
        footer="Updated 2 minutes ago"
      >
        <BarChart
          title="By region"
          highlight="EMEA"
          format={(n) => `€${n}k`}
          data={[
            { label: "EMEA", value: 84 },
            { label: "Americas", value: 61 },
            { label: "APAC", value: 33 },
          ]}
        />
      </WidgetFrame>
    </div>
  );
}
