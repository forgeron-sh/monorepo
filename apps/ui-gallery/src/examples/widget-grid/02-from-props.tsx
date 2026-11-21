import { Donut, Funnel, Gauge, KpiRow, WidgetFrame, WidgetGrid } from "@forgeron/ui";

const widgets = [
  {
    id: "kpi",
    label: "Key figures",
    content: (
      <WidgetFrame title="This month">
        <KpiRow
          items={[
            { label: "Revenue", value: "€48.2k", delta: 0.124 },
            { label: "Leads", value: "212", delta: -0.06 },
          ]}
        />
      </WidgetFrame>
    ),
  },
  {
    id: "quota",
    label: "Quota",
    content: (
      <WidgetFrame title="Quota">
        <Gauge title="Quarter" value={36} target={50} size={160} />
      </WidgetFrame>
    ),
  },
  {
    id: "funnel",
    label: "Funnel",
    content: (
      <WidgetFrame title="Pipeline">
        <Funnel
          title="Deals"
          items={[
            { label: "Lead", value: 480 },
            { label: "Qualified", value: 212 },
            { label: "Won", value: 38 },
          ]}
        />
      </WidgetFrame>
    ),
  },
  {
    id: "sources",
    label: "Sources",
    content: (
      <WidgetFrame title="Sources">
        <Donut
          title="Leads"
          size={120}
          items={[
            { label: "Web", value: 60 },
            { label: "Referral", value: 30 },
            { label: "Events", value: 10 },
          ]}
        />
      </WidgetFrame>
    ),
  },
];

export default function Default() {
  return (
    <div style={{ width: "100%" }}>
      <WidgetGrid
        widgets={widgets}
        rowHeight={120}
        defaultLayout={[
          { id: "kpi", x: 0, y: 0, w: 8, h: 2 },
          { id: "quota", x: 8, y: 0, w: 4, h: 3 },
          { id: "funnel", x: 0, y: 2, w: 4, h: 4 },
          { id: "sources", x: 4, y: 2, w: 4, h: 4 },
        ]}
      />
    </div>
  );
}
