import { EmojiPicker, type EmojiCategory } from "@forgeron/ui";

// A set of your own: the status words of a support team, as user content.
const set: EmojiCategory[] = [
  {
    id: "status",
    label: "Status",
    mark: "✅",
    emoji: [
      { char: "✅", name: "resolved" },
      { char: "👀", name: "looking" },
      { char: "⏳", name: "waiting" },
      { char: "🚧", name: "blocked" },
    ],
  },
];

export default function OwnSet() {
  return (
    <div style={{ width: 260 }}>
      <EmojiPicker categories={set} columns={4} onSelect={() => {}} />
    </div>
  );
}
