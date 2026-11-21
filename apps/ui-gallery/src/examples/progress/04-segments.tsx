import { Progress } from "@forgeron/ui";

export default function Segments() {
  return (
    <div style={{ display: "grid", gap: 20, width: 320 }}>
      <Progress label="Onboarding, step 3 of 5" value={3} max={5} segments={5} />
      <Progress label="Days off used" value={18} max={25} segments={25} showValue />
    </div>
  );
}
