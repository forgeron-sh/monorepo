import { AttachmentList } from "@forgeron/ui";

const dot =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#888"/><rect width="4" height="4" fill="#bbb"/><rect x="4" y="4" width="4" height="4" fill="#bbb"/></svg>',
  );

export default function Grid() {
  return (
    <AttachmentList
      layout="grid"
      items={[
        { id: "a", name: "mockup.png", type: "image/png", size: 310_000, thumbnail: dot, url: "#" },
        { id: "b", name: "notes.txt", size: 1200, url: "#" },
      ]}
    />
  );
}
