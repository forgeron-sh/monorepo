import { JsonView } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 320 }}>
      <JsonView
        label="Output"
        value={{ id: 4182, name: "Transalp", amount: 9600, won: true, lost_reason: null }}
      />
    </div>
  );
}
