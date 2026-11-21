// Conditions: a group of rules on the fields of an item, tested, described and labelled. Pure, no
// React. The automation blocks re-export it.

import type { IconDefinition } from "@forgeron/icons";
import { getPath } from "./template-model";

export type ConditionFieldType = "text" | "number" | "date" | "boolean" | "enum";

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "before"
  | "after"
  | "is_true"
  | "is_false"
  | "empty"
  | "not_empty";

export interface ConditionField {
  /** The path read in the item: `deal.amount`. */
  id: string;
  label: string;
  type: ConditionFieldType;
  /** The choices of an `enum` field. */
  options?: ReadonlyArray<{ value: string; label: string }>;
  icon?: IconDefinition;
}

export interface ConditionRule {
  id: string;
  field: string;
  operator: ConditionOperator;
  /** Text as typed; may hold `{{ references }}`. */
  value?: string;
}

export interface ConditionGroup {
  id: string;
  combinator: "and" | "or";
  rules: ReadonlyArray<ConditionRule | ConditionGroup>;
}

export const isConditionGroup = (x: ConditionRule | ConditionGroup): x is ConditionGroup =>
  "rules" in x;

/** The words of each operator, as read in a sentence: `Amount is more than 5000`. */
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: "is",
  neq: "is not",
  gt: "is more than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  contains: "contains",
  not_contains: "does not contain",
  starts_with: "starts with",
  before: "is before",
  after: "is after",
  is_true: "is true",
  is_false: "is false",
  empty: "is empty",
  not_empty: "is not empty",
};

/** The operators that make sense for each type of field, the usual one first. */
export const OPERATORS_BY_TYPE: Record<ConditionFieldType, ReadonlyArray<ConditionOperator>> = {
  text: ["eq", "neq", "contains", "not_contains", "starts_with", "empty", "not_empty"],
  number: ["gt", "gte", "lt", "lte", "eq", "neq", "empty", "not_empty"],
  date: ["before", "after", "eq", "empty", "not_empty"],
  boolean: ["is_true", "is_false"],
  enum: ["eq", "neq", "empty", "not_empty"],
};

/** Whether the operator compares to a value (`is empty` does not). */
export const operatorTakesValue = (op: ConditionOperator) =>
  !["is_true", "is_false", "empty", "not_empty"].includes(op);

function testRule(rule: ConditionRule, actual: unknown): boolean {
  const value = rule.value ?? "";
  const isEmpty = actual === undefined || actual === null || actual === "";
  const a = typeof actual === "string" ? actual : actual == null ? "" : String(actual);
  const na = Number(actual);
  const nb = Number(value);
  const numeric = !isEmpty && value !== "" && !Number.isNaN(na) && !Number.isNaN(nb);
  switch (rule.operator) {
    case "eq":
      return numeric ? na === nb : a === value;
    case "neq":
      return numeric ? na !== nb : a !== value;
    case "gt":
      return numeric && na > nb;
    case "gte":
      return numeric && na >= nb;
    case "lt":
      return numeric && na < nb;
    case "lte":
      return numeric && na <= nb;
    case "contains":
      return a.toLowerCase().includes(value.toLowerCase());
    case "not_contains":
      return !a.toLowerCase().includes(value.toLowerCase());
    case "starts_with":
      return a.toLowerCase().startsWith(value.toLowerCase());
    case "before":
      return !isEmpty && a < value;
    case "after":
      return !isEmpty && a > value;
    case "is_true":
      return actual === true || a === "true";
    case "is_false":
      return actual === false || a === "false";
    case "empty":
      return isEmpty || (Array.isArray(actual) && actual.length === 0);
    case "not_empty":
      return !(isEmpty || (Array.isArray(actual) && actual.length === 0));
  }
}

/** Whether an item passes the condition. An empty group passes. */
export function evaluateCondition(group: ConditionGroup, item: unknown): boolean {
  if (group.rules.length === 0) return true;
  const results = group.rules.map((r) =>
    isConditionGroup(r) ? evaluateCondition(r, item) : testRule(r, getPath(item, r.field)),
  );
  return group.combinator === "and" ? results.every(Boolean) : results.some(Boolean);
}

/** The condition in one line: `Amount is more than 5000 and (Stage is Won or …)`. */
export function describeCondition(
  group: ConditionGroup,
  fields: ReadonlyArray<ConditionField>,
): string {
  const parts = group.rules.map((r) => {
    if (isConditionGroup(r)) return `(${describeCondition(r, fields)})`;
    const field = fields.find((f) => f.id === r.field);
    const label = field?.label ?? r.field;
    if (!operatorTakesValue(r.operator)) return `${label} ${OPERATOR_LABELS[r.operator]}`;
    const shown = field?.options?.find((o) => o.value === r.value)?.label ?? r.value ?? "";
    return `${label} ${OPERATOR_LABELS[r.operator]} ${shown || "…"}`;
  });
  return parts.length ? parts.join(` ${group.combinator} `) : "Always";
}
