import { SearchBox } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 12, width: 320 }}>
      <SearchBox placeholder="Search issues" shortcut="/" />
      <SearchBox placeholder="Search or run a command" shortcut={["⌘", "K"]} />
    </div>
  );
}
