import { StackedBar } from "@forgeron/ui";

export default function Horizontal() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <StackedBar
        title="Tickets by status"
        series={[
          { key: "open", label: "Open" },
          { key: "waiting", label: "Waiting" },
          { key: "done", label: "Done" },
        ]}
        items={[
          { label: "Mon", values: { open: 12, waiting: 5, done: 20 } },
          { label: "Tue", values: { open: 9, waiting: 7, done: 26 } },
          { label: "Wed", values: { open: 14, waiting: 4, done: 18 } },
          { label: "Thu", values: { open: 6, waiting: 3, done: 31 } },
        ]}
        highlight="Thu"
      />
    </div>
  );
}
