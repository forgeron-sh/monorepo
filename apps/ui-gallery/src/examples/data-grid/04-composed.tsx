import {
  ConstraintChip,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridEmpty,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
} from "@forgeron/ui";
import { useState } from "react";

const people = [
  { id: 1, name: "Ada", visits: 12 },
  { id: 2, name: "Grace", visits: 40 },
  { id: 3, name: "Linus", visits: 7 },
];

// The parts: write the header, the rows and the cells yourself, keep the sort and the open row.
export default function Composed() {
  const [descending, setDescending] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const rows = [...people].sort((a, b) => (a.visits - b.visits) * (descending ? -1 : 1));
  return (
    <div style={{ width: "100%" }}>
      <DataGrid label="people">
        <DataGridHeader>
          <DataGridHeaderCell>
            name <ConstraintChip kind="notNull" />
          </DataGridHeaderCell>
          <DataGridHeaderCell
            numeric
            sorted={descending ? "descending" : "ascending"}
            onSort={() => setDescending((d) => !d)}
          >
            visits
          </DataGridHeaderCell>
        </DataGridHeader>
        <DataGridBody>
          {rows.length === 0 ? (
            <DataGridEmpty colSpan={2}>Nobody</DataGridEmpty>
          ) : (
            rows.map((row) => (
              <DataGridRow key={row.id} selected={open === row.id} onOpen={() => setOpen(row.id)}>
                <DataGridCell cell={row.name} />
                <DataGridCell numeric cell={row.visits} />
              </DataGridRow>
            ))
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
