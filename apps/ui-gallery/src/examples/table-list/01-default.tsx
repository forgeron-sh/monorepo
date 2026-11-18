import { TableList } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [current, setCurrent] = useState("companies");
  return (
    <div style={{ width: 220 }}>
      <TableList
        current={current}
        onSelect={setCurrent}
        sections={[
          {
            key: "tables",
            heading: "Tables",
            onAdd: () => {},
            addLabel: "New table",
            items: [
              { id: "companies", name: "companies" },
              { id: "contacts", name: "contacts" },
              { id: "deals", name: "deals" },
            ],
          },
        ]}
      />
    </div>
  );
}
