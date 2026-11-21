import { FieldPlacer, type PlacedField } from "@forgeron/ui";
import { useState } from "react";

const page = (n: number) => ({
  id: `p${n}`,
  width: 600,
  height: 800,
  alt: `Page ${n} of the agreement`,
  src: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#fff"/><text x="48" y="80" font-family="monospace" font-size="22" fill="#222">Service agreement - page ${n}</text>${Array.from({ length: 14 }, (_, i) => `<rect x="48" y="${130 + i * 28}" width="${i % 5 === 4 ? 300 : 504}" height="8" fill="#ccc"/>`).join("")}</svg>`,
  )}`,
});
const pages = [1, 2, 3].map(page);

const participants = [
  { id: "lea", name: "Léa Martin", role: "Client" },
  { id: "jo", name: "Jo Bernard", role: "Provider" },
];

export default function Default() {
  const [fields, setFields] = useState<PlacedField[]>([
    {
      id: "field-1",
      type: "signature",
      page: 1,
      x: 0.12,
      y: 0.62,
      w: 0.28,
      h: 0.06,
      participantId: "lea",
    },
    {
      id: "field-2",
      type: "date",
      page: 1,
      x: 0.55,
      y: 0.62,
      w: 0.16,
      h: 0.03,
      participantId: "jo",
    },
  ]);
  return (
    <div style={{ width: "100%" }}>
      <FieldPlacer
        label="Fields of the agreement"
        pages={pages}
        participants={participants}
        value={fields}
        onChange={setFields}
        viewer={{ height: 460, thumbnails: false }}
      />
    </div>
  );
}
