import { Kbd, KbdGroup } from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>⌥</Kbd>
        <Kbd>⌃</Kbd>
      </KbdGroup>
      <div>
        Use{" "}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>B</Kbd>
        </KbdGroup>{" "}
        to open the sidebar.
      </div>
    </div>
  );
}
