import { DataGrid, Pager } from "@forgeron/ui";
import { useState } from "react";

const all = Array.from({ length: 23 }, (_, i) => [
  i + 1,
  `order-${String(4100 + i)}`,
  ["paid", "sent", "draft"][i % 3]!,
]);
const pageSize = 5;

export default function UnderAGrid() {
  const [page, setPage] = useState(1);
  const rows = all.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 520 }}>
      <DataGrid
        label="orders"
        columns={[
          { name: "id", type: "integer", chips: [{ kind: "primary" }], numeric: true },
          { name: "reference", type: "text", chips: [{ kind: "unique" }] },
          { name: "status", type: "text" },
        ]}
        rows={rows}
      />
      <Pager
        page={page}
        pageSize={pageSize}
        count={rows.length}
        total={all.length}
        hasMore={page * pageSize < all.length}
        onPage={setPage}
      />
    </div>
  );
}
