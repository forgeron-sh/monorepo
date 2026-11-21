import { FileBrowser, type DriveItem } from "@forgeron/ui";

const items: DriveItem[] = [
  {
    id: "f1",
    name: "Contracts",
    kind: "folder",
    modified: "2026-11-10 10:02",
    owner: "Léa Martin",
  },
  {
    id: "a",
    name: "Dock plan.pdf",
    size: 240_000,
    modified: "2026-11-18 09:12",
    owner: "Léa Martin",
    shared: true,
  },
  {
    id: "b",
    name: "Tariffs 2027.xlsx",
    size: 52_400,
    modified: "2026-11-12 16:40",
    owner: "Camille Roy",
    starred: true,
  },
  {
    id: "c",
    name: "Yard after the walk.jpg",
    size: 1_840_000,
    modified: "2026-10-02 08:15",
    owner: "Tom Garnier",
  },
];

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <FileBrowser
        items={items}
        today="2026-11-18"
        defaultSelected={["a"]}
        columns={["owner", "modified"]}
      />
    </div>
  );
}
