import { Pager } from "@forgeron/ui";
import { useState } from "react";

const total = 120;
const pageSize = 50;

export default function Default() {
  const [page, setPage] = useState(2);
  const count = Math.min(pageSize, total - (page - 1) * pageSize);
  return (
    <div style={{ width: 360 }}>
      <Pager
        page={page}
        pageSize={pageSize}
        count={count}
        total={total}
        hasMore={page * pageSize < total}
        onPage={setPage}
      />
    </div>
  );
}
