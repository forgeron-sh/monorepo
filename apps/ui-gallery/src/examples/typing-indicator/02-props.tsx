import { PresenceDot, TypingIndicator } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TypingIndicator names={["Léa"]} />
      <TypingIndicator names={["Léa", "Karim"]} />
      <TypingIndicator names={["Léa", "Karim", "Sam", "Jo"]} />
      <div style={{ display: "flex", gap: 20 }}>
        <PresenceDot status="online" showLabel />
        <PresenceDot status="away" showLabel />
        <PresenceDot status="busy" showLabel />
        <PresenceDot status="offline" showLabel />
      </div>
    </div>
  );
}
