import { Button, Input, Select } from "@forgeron/ui";
import { useState } from "react";
import type { DbColumn, Filter, Operator } from "./api";

const OPERATOR_LABEL: Record<Operator, string> = {
  eq: "is",
  neq: "is not",
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  contains: "contains",
  startsWith: "starts with",
  isNull: "is empty",
  notNull: "is not empty",
};

/** Typed filters: a column, an operator that fits its type, a value. Sent to the server, which builds the SQL. */
export function FilterBar({
  columns,
  applied,
  onApply,
}: {
  /** Columns that can be filtered on: the masked ones are not offered. */
  columns: DbColumn[];
  applied: Filter[];
  onApply: (filters: Filter[]) => void;
}) {
  const usable = columns.filter((c) => !c.masked);
  const [draft, setDraft] = useState<Filter[]>(applied);
  const change = (index: number, next: Filter) =>
    setDraft(draft.map((f, i) => (i === index ? next : f)));
  const add = () => {
    const first = usable[0];
    if (first) setDraft([...draft, { column: first.name, op: first.operators[0]!, value: "" }]);
  };
  const apply = () =>
    onApply(
      draft
        .filter((f) => f.op === "isNull" || f.op === "notNull" || (f.value ?? "") !== "")
        .map((f) => (f.op === "isNull" || f.op === "notNull" ? { column: f.column, op: f.op } : f)),
    );

  return (
    <form
      className="fc-db-filters"
      aria-label="Filters"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      {draft.map((filter, index) => {
        const column = usable.find((c) => c.name === filter.column) ?? usable[0]!;
        const noValue = filter.op === "isNull" || filter.op === "notNull";
        return (
          <div className="fc-db-filter" key={index}>
            <Select
              aria-label={`Filter ${index + 1} column`}
              value={filter.column}
              options={usable.map((c) => ({ value: c.name, label: c.name }))}
              onChange={(e) => {
                const next = usable.find((c) => c.name === e.target.value)!;
                change(index, {
                  column: next.name,
                  op: next.operators.includes(filter.op) ? filter.op : next.operators[0]!,
                  value: filter.value,
                });
              }}
            />
            <Select
              aria-label={`Filter ${index + 1} operator`}
              value={filter.op}
              options={column.operators.map((op) => ({ value: op, label: OPERATOR_LABEL[op] }))}
              onChange={(e) => change(index, { ...filter, op: e.target.value as Operator })}
            />
            {noValue ? null : (
              <Input
                mono
                aria-label={`Filter ${index + 1} value`}
                inputMode={column.kind === "text" ? "text" : "decimal"}
                value={filter.value ?? ""}
                onChange={(e) => change(index, { ...filter, value: e.target.value })}
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setDraft(draft.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        );
      })}
      <div className="fc-db-filter-actions">
        <Button
          size="sm"
          type="button"
          onClick={add}
          disabled={usable.length === 0 || draft.length >= 10}
        >
          Add filter
        </Button>
        {draft.length > 0 || applied.length > 0 ? (
          <Button size="sm" variant="primary" type="submit">
            Apply
          </Button>
        ) : null}
        {applied.length > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => {
              setDraft([]);
              onApply([]);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  );
}
