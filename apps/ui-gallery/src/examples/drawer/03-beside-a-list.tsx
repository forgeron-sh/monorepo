import { Copy01Icon } from "@forgeron/icons";
import { Badge, Button, DetailList, Drawer, IconButton, Table } from "@forgeron/ui";
import { useState } from "react";

type Lead = { id: string; name: string; company: string; stage: string; value: string };

const leads: Lead[] = [
  { id: "L-88", name: "Camille Roy", company: "Maison Roy", stage: "Proposal", value: "€12,400" },
  {
    id: "L-87",
    name: "Hugo Bernard",
    company: "Bernard & fils",
    stage: "Qualified",
    value: "€3,100",
  },
  { id: "L-85", name: "Léa Martin", company: "Atelier Martin", stage: "New", value: "€860" },
];

// Not modal: the list stays readable and clickable while the drawer shows one lead.
export default function BesideAList() {
  const [open, setOpen] = useState<Lead | null>(leads[0]!);
  return (
    <div style={{ display: "flex", gap: 12, width: "100%", height: 340, alignItems: "stretch" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Table<Lead>
          label="Leads"
          rows={leads}
          rowKey={(l) => l.id}
          onRowClick={setOpen}
          columns={[
            { key: "name", header: "Lead" },
            { key: "value", header: "Value", align: "end", mono: true },
          ]}
        />
      </div>
      {open ? (
        <Drawer
          key={open.id}
          title={open.name}
          description={`${open.id} · ${open.company}`}
          onClose={() => setOpen(null)}
          actions={<IconButton icon={Copy01Icon} label="Copy link" size="sm" />}
          footer={
            <>
              <Button size="sm" variant="primary">
                Mark as won
              </Button>
              <Button size="sm" variant="ghost">
                Log a call
              </Button>
            </>
          }
        >
          <DetailList
            items={[
              { label: "Stage", value: <Badge>{open.stage}</Badge> },
              { label: "Value", value: open.value },
              { label: "Company", value: open.company },
            ]}
          />
        </Drawer>
      ) : null}
    </div>
  );
}
