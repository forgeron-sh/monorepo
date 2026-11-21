import { AlarmClockIcon } from "@forgeron/icons";
import { InboxList } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [selected, setSelected] = useState("n1");
  return (
    <div style={{ width: 300, borderTop: "1px solid var(--line)" }}>
      <InboxList
        selectedId={selected}
        onSelect={setSelected}
        items={[
          {
            id: "n1",
            reference: "OPS-40",
            title: "Supplier invoices arrive twice from Odoo",
            preview: "Hugo Bernard commented: “Odoo sends the webhook twice…”",
            time: "2h",
            unread: true,
            person: "Hugo Bernard",
          },
          {
            id: "n2",
            reference: "OPS-31",
            title: "Supplier portal: sign-in with an expired invite",
            preview: "Léa Martin mentioned you",
            time: "4h",
            unread: true,
            person: "Léa Martin",
          },
          {
            id: "n3",
            reference: "OPS-22",
            title: "Fire exit signage audit",
            preview: "Overdue since yesterday",
            time: "9h",
            icon: AlarmClockIcon,
          },
        ]}
      />
    </div>
  );
}
