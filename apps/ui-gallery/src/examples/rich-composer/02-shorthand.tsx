import { RichComposer, type MentionOption } from "@forgeron/ui";
import { useState } from "react";

const people: MentionOption[] = [
  { id: "lea", label: "Léa Martin", hint: "Team lead" },
  { id: "karim", label: "Karim Aziz", hint: "Controller" },
  { id: "sam", label: "Sam Roche", hint: "Director" },
];
const records: MentionOption[] = [
  { id: "ops-40", label: "OPS-40", hint: "Webhook sent twice" },
  { id: "ops-52", label: "OPS-52", hint: "Export timeout" },
];
const commands: MentionOption[] = [
  { id: "remind", label: "/remind", hint: "Remind me later", insert: "/remind " },
  { id: "shrug", label: "/shrug", hint: "Append a shrug", insert: "¯\\_(ツ)_/¯" },
];

export default function Default() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <RichComposer
        placeholder="Type @ to mention, # for a record, / for a command"
        triggers={[
          { char: "@", label: "People", options: people },
          { char: "#", label: "Records", options: records },
          { char: "/", label: "Commands", options: commands, atLineStart: true },
        ]}
        onSend={({ text, mentions }) =>
          setSent((s) => [`${text}  [${mentions.length} mention(s)]`, ...s])
        }
      />
      <ul
        style={{
          margin: "12px 0 0",
          padding: 0,
          listStyle: "none",
          font: "12px var(--font-mono)",
          color: "var(--ink-muted)",
        }}
      >
        {sent.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
