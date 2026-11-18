// A database switcher above, row counts on demand, a section of bridged tables with their state.
import { DatabaseIcon, Route01Icon } from "@forgeron/icons";
import { Led, SelectMenu, TableList } from "@forgeron/ui";
import { useState } from "react";

const databases = {
  "crm-db": ["companies", "contacts", "deals", "activities"],
  "tasks-db": ["issues", "projects", "cycles", "comments"],
};

export default function WithHeader() {
  const [db, setDb] = useState<keyof typeof databases>("crm-db");
  const [current, setCurrent] = useState("companies");
  return (
    <div style={{ width: 240 }}>
      <TableList
        current={current}
        onSelect={setCurrent}
        showCounts
        header={
          <SelectMenu
            label="Database"
            options={Object.keys(databases).map((d) => ({
              value: d,
              label: d,
              icon: DatabaseIcon,
            }))}
            value={db}
            onChange={(next) => {
              if (next && next in databases) setDb(next as keyof typeof databases);
            }}
          />
        }
        sections={[
          {
            key: "tables",
            heading: "Tables",
            onAdd: () => {},
            addLabel: "New table",
            items: databases[db].map((name, i) => ({ id: name, name, count: (i + 2) * 137 })),
          },
          {
            key: "bridged",
            heading: "Bridged",
            items: [
              {
                id: "odoo.res_partner",
                name: "odoo.res_partner",
                icon: Route01Icon,
                trailing: <Led tone="warning" label="Sync failing" />,
              },
            ],
          },
        ]}
      />
    </div>
  );
}
