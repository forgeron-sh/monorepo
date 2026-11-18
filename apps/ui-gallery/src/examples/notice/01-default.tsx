import { Button, Notice } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <Notice
        tone="warning"
        title="The Odoo token expires in 3 days."
        action={<Button size="sm">Renew</Button>}
      />
    </div>
  );
}
