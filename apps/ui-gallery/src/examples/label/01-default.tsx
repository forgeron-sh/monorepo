import { Input, Label } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 8, width: 280 }}>
      <Label htmlFor="label-email">Email</Label>
      <Input id="label-email" type="email" placeholder="you@example.com" />
    </div>
  );
}
