import { Checkbox } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid" }}>
      <Checkbox label="Send a copy to the client" defaultChecked />
      <Checkbox label="Attach the invoice as PDF" />
      <Checkbox label="Archived" disabled />
    </div>
  );
}
