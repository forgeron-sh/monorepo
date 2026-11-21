import { StatusStrip, type StatusStripItem } from "@forgeron/ui";

const statuses =
  "ok ok ok ok ok degraded down ok ok ok ok ok ok ok ok ok ok degraded ok ok ok ok ok ok ok ok ok ok ok ok".split(
    " ",
  );
const items: StatusStripItem[] = statuses.map((status, i) => ({
  label: `Nov ${i + 1}`,
  status: status as StatusStripItem["status"],
}));

// Deploys on the strip: the incident on Nov 7 follows the release of Nov 6.
export default function WithEvents() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <StatusStrip
        title="Connector, November"
        items={items}
        markers={[
          { at: "Nov 6", label: "Release 4.2" },
          { at: "Nov 18", label: "Release 4.3" },
        ]}
      />
    </div>
  );
}
