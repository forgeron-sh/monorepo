import {
  DiffBar,
  DiffFold,
  DiffHunk,
  DiffLine,
  DiffSame,
  DiffTable,
  DiffView,
  structureDiffRows,
  structureDiffStats,
} from "@forgeron/ui";

const before = ["Plan: Pro", "Seats: 5", "Billing: monthly", "Support: email"].join("\n");
const after = ["Plan: Pro", "Seats: 8", "Billing: yearly", "Support: email"].join("\n");

export default function Composed() {
  const rows = structureDiffRows(before, after, { context: 1, collapse: true });
  const stats = structureDiffStats(rows);
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <DiffView defaultMode="unified" beforeLabel="v1" afterLabel="v2">
        <DiffBar added={stats.added} removed={stats.removed} />
        {stats.added + stats.removed === 0 ? (
          <DiffSame>No difference.</DiffSame>
        ) : (
          <DiffTable>
            <DiffHunk>
              {rows.map((row, i) =>
                row.kind === "fold" ? (
                  <DiffFold key={row.id} count={row.count} onUnfold={() => {}} />
                ) : (
                  <DiffLine
                    key={i}
                    kind={row.kind}
                    text={row.text}
                    {...("aNo" in row ? { aNo: row.aNo } : {})}
                    {...("bNo" in row ? { bNo: row.bNo } : {})}
                    {...("pieces" in row && row.pieces ? { pieces: row.pieces } : {})}
                  />
                ),
              )}
            </DiffHunk>
          </DiffTable>
        )}
      </DiffView>
    </div>
  );
}
