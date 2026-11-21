import { Badge, Table } from "@forgeron/ui";
import { useState } from "react";

type Member = { id: string; name: string; email: string; role: string; active: boolean };

const members: Member[] = [
  { id: "cr", name: "Camille Roy", email: "camille@roy.fr", role: "Owner", active: true },
  { id: "hb", name: "Hugo Bernard", email: "hugo@roy.fr", role: "Member", active: true },
  { id: "lm", name: "Léa Martin", email: "lea@roy.fr", role: "Member", active: false },
];

// A row is a button: click it, or Tab to it and press Enter.
export default function ClickableRows() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%" }}>
      <Table<Member>
        label="Members"
        rowKey={(m) => m.id}
        rows={members}
        onRowClick={(m) => setOpened(m.name)}
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email", mono: true },
          { key: "role", header: "Role" },
          {
            key: "active",
            header: "Status",
            align: "end",
            render: (m) =>
              m.active ? (
                <Badge tone="success" dot>
                  Active
                </Badge>
              ) : (
                <Badge dot>Invited</Badge>
              ),
          },
        ]}
      />
      <p style={{ margin: 0, color: "var(--ink-muted)" }}>
        {opened ? `Opened: ${opened}` : "Open a member"}
      </p>
    </div>
  );
}
