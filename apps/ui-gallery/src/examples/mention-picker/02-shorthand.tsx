import {
  filterMentionOptions,
  MentionPicker,
  mentionOptionId,
  type MentionOption,
} from "@forgeron/ui";
import { useState } from "react";

const people: MentionOption[] = [
  { id: "lea", label: "Léa Martin", hint: "Team lead" },
  { id: "karim", label: "Karim Aziz", hint: "Controller" },
  { id: "jo", label: "Jo Bernard", hint: "Accounting" },
  { id: "sam", label: "Sam Roche", hint: "Director" },
];

export default function Default() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState("nobody yet");
  const options = filterMentionOptions(people, query);
  return (
    <div style={{ width: 300 }}>
      <input
        aria-label="Search people"
        role="combobox"
        aria-expanded
        aria-controls="mp-demo"
        aria-activedescendant={
          options.length
            ? mentionOptionId("mp-demo", Math.min(active, options.length - 1))
            : undefined
        }
        value={query}
        placeholder="Type a name"
        style={{
          width: "100%",
          height: 32,
          padding: "0 8px",
          border: "1px solid var(--line-strong)",
          background: "var(--bg-sunk)",
          color: "var(--ink)",
          borderRadius: 0,
          boxSizing: "border-box",
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, options.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Enter" && options[active]) setPicked(options[active]!.label);
          else return;
          e.preventDefault();
        }}
      />
      <div style={{ margin: "8px 0" }}>
        <MentionPicker
          id="mp-demo"
          label="People"
          mark="@"
          options={options}
          activeIndex={active}
          onActiveIndexChange={setActive}
          onSelect={(o) => setPicked(o.label)}
        />
      </div>
      <p style={{ font: "12px var(--font-mono)", color: "var(--ink-muted)" }}>Picked: {picked}</p>
    </div>
  );
}
