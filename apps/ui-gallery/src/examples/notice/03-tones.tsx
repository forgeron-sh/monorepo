import { Button, Notice } from "@forgeron/ui";

export default function Tones() {
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 520 }}>
      <Notice title="Previews close after 7 days." />
      <Notice tone="success" title="crm 1.4.0 is live." />
      <Notice
        tone="warning"
        title="The Odoo token expires in 3 days."
        action={<Button size="sm">Renew</Button>}
      />
      <Notice tone="danger" title="The deploy failed.">
        The build stopped on a type error in src/actions.ts.
      </Notice>
    </div>
  );
}
