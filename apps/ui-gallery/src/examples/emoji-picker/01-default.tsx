import { EmojiPicker, EmojiPickerGrid, EmojiPickerSearch, EmojiPickerTabs } from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [last, setLast] = useState("");
  return (
    <div style={{ display: "grid", gap: 8, width: 300 }}>
      <EmojiPicker onEmojiSelect={setLast} columns={6}>
        <EmojiPickerSearch />
        <EmojiPickerTabs />
        <EmojiPickerGrid />
      </EmojiPicker>
      <span style={{ font: "400 11px/16px var(--font-mono)" }}>
        Chosen: {last || "nothing yet"}
      </span>
    </div>
  );
}
