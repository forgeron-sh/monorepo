import {
  CursorPresence,
  CursorPresenceCursor,
  CursorPresenceList,
  CursorPresencePointer,
  CursorPresenceSelection,
  type EditorCursor,
} from "@forgeron/ui";

const cursors: EditorCursor[] = [
  { id: "lea", name: "Léa", x: 90, y: 60 },
  { id: "karim", name: "Karim", x: 380, y: 170, status: "drawing" },
  {
    id: "jo",
    name: "Jo",
    color: "#3ddc84",
    x: 330,
    y: 110,
    selection: { x: 200, y: 90, w: 140, h: 70 },
  },
];

export default function Default() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 520,
        height: 240,
        border: "1px solid var(--line-strong)",
        background: "var(--bg-sunk)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 90,
          width: 140,
          height: 70,
          border: "1px solid var(--ink-dim)",
          background: "var(--bg-raised)",
        }}
      />
      <CursorPresence label="People here" cursors={cursors}>
        <CursorPresenceList />
        <div aria-hidden="true">
          {cursors.map((c) => (
            <CursorPresenceCursor key={c.id} cursor={c}>
              <CursorPresenceSelection />
              <CursorPresencePointer />
            </CursorPresenceCursor>
          ))}
        </div>
      </CursorPresence>
    </div>
  );
}
