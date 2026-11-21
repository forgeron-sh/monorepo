import { Pager } from "@forgeron/ui";

// The server does not count past a limit: no total, and a way to narrow instead.
export default function UnknownTotal() {
  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <Pager
        page={20}
        pageSize={50}
        count={50}
        hasMore={false}
        onPage={() => {}}
        limitNote="Paging stops at 1,000 rows: add a filter to see more."
      />
    </div>
  );
}
