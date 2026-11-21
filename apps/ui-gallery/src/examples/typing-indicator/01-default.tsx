import {
  PresenceDot,
  PresenceDotLabel,
  PresenceDotMark,
  TypingIndicator,
  TypingIndicatorDots,
  TypingIndicatorText,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TypingIndicator names={["Léa", "Karim"]}>
        <TypingIndicatorText />
        <TypingIndicatorDots />
      </TypingIndicator>
      <div style={{ display: "flex", gap: 20 }}>
        <PresenceDot status="online">
          <PresenceDotMark decorative />
          <PresenceDotLabel />
        </PresenceDot>
        <PresenceDot status="busy">
          <PresenceDotLabel>Do not disturb</PresenceDotLabel>
          <PresenceDotMark decorative />
        </PresenceDot>
      </div>
    </div>
  );
}
