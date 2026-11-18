import { Input } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 12, width: 320 }}>
      <Input placeholder="Search contacts" aria-label="Search contacts" />
      <Input mono defaultValue="crm.atelier-moreau.fr" aria-label="Domain" />
      <Input disabled placeholder="Disabled" aria-label="Disabled" />
    </div>
  );
}
