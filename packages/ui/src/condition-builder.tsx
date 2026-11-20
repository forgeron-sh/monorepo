// The condition of an If, a filter or a trigger, after the If block of the Flows prototype grown
// into rows: a field, an operator that fits its type, a value, joined by `and` or `or` (the word
// at the join switches it), with groups for a mix. Values take `{{ references }}` when the
// previous steps are given. With children, `ConditionBuilder` is the root of its parts
// (`ConditionBuilderGroup`, `ConditionBuilderRule`); without, the props-driven builder built from
// them (D-157).

import { Cancel01Icon, PlusSignIcon } from "@forgeron/icons";
import { createContext, useContext, type ReactNode } from "react";
import {
  isConditionGroup,
  OPERATOR_LABELS,
  OPERATORS_BY_TYPE,
  operatorTakesValue,
  type ConditionField,
  type ConditionGroup,
  type ConditionRule,
} from "./condition-model";
import type { VariableSource } from "./template-model";
import { Button } from "./button";
import { cx } from "./cx";
import { ExpressionInput } from "./expression-input";
import { Input } from "./form";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";
import { IconButton } from "./identity";
import { SelectMenu } from "./overlays";

export interface ConditionBuilderProps {
  value?: ConditionGroup;
  defaultValue?: ConditionGroup;
  onChange?: (value: ConditionGroup) => void;
  /** What can be tested, with its type: the operators and the value control follow it. */
  fields: ReadonlyArray<ConditionField>;
  /** The outputs of the previous steps: text values take `{{ references }}`. */
  variables?: ReadonlyArray<VariableSource>;
  /** How deep groups go; 1 allows no group. */
  maxDepth?: number;
  readOnly?: boolean;
  label?: string;
  /** The parts of a composed builder. Without them, the builder draws its root group. */
  children?: ReactNode;
  className?: string;
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${(seq += 1).toString(36)}`;

/** An empty condition: one group, `and`, no rule. */
export const emptyCondition = (): ConditionGroup => ({
  id: nextId("g"),
  combinator: "and",
  rules: [],
});

interface ConditionState {
  root: ConditionGroup;
  fields: ReadonlyArray<ConditionField>;
  variables: ReadonlyArray<VariableSource> | undefined;
  maxDepth: number;
  readOnly: boolean | undefined;
  label: string;
  change: (groupId: string, fn: (g: ConditionGroup) => ConditionGroup) => void;
  newRule: () => ConditionRule;
}

const ConditionContext = createContext<ConditionState | null>(null);

function useCondition(): ConditionState {
  const state = useContext(ConditionContext);
  if (!state) throw new Error("ConditionBuilder parts go inside <ConditionBuilder>.");
  return state;
}

const updateGroup = (
  group: ConditionGroup,
  id: string,
  fn: (g: ConditionGroup) => ConditionGroup,
): ConditionGroup =>
  group.id === id
    ? fn(group)
    : {
        ...group,
        rules: group.rules.map((r) => (isConditionGroup(r) ? updateGroup(r, id, fn) : r)),
      };

/**
 * Rows of field, operator and value, joined by and / or, in groups. With children: the root of
 * the parts; without: the root group and everything under it.
 */
export function ConditionBuilder({
  value,
  defaultValue,
  onChange,
  fields,
  variables,
  maxDepth = 2,
  readOnly,
  label = "Condition",
  children,
  className,
}: ConditionBuilderProps) {
  const [root, setRoot] = useControllableState<ConditionGroup>({
    value,
    defaultValue: defaultValue ?? { id: "root", combinator: "and", rules: [] },
    onChange,
  });
  const state: ConditionState = {
    root,
    fields,
    variables,
    maxDepth,
    readOnly,
    label,
    change: (groupId, fn) => setRoot(updateGroup(root, groupId, fn)),
    newRule: () => {
      const field = fields[0];
      return {
        id: nextId("r"),
        field: field?.id ?? "",
        operator: OPERATORS_BY_TYPE[field?.type ?? "text"][0]!,
        value: "",
      };
    },
  };
  return (
    <ConditionContext.Provider value={state}>
      <div className={cx("fg-cond", className)}>{children ?? <ConditionBuilderGroup />}</div>
    </ConditionContext.Provider>
  );
}

export interface ConditionBuilderGroupProps {
  /** The group to draw; the root of the builder by default. */
  group?: ConditionGroup;
  /** 1 for the root group. */
  depth?: number;
  /** The group it sits in, to offer Remove group. */
  parent?: ConditionGroup;
  className?: string;
}

/** A group: its rules (and groups) joined by the combinator, and the buttons that add more. */
export function ConditionBuilderGroup({
  group: groupProp,
  depth = 1,
  parent,
  className,
}: ConditionBuilderGroupProps) {
  const c = useCondition();
  const group = groupProp ?? c.root;
  const { readOnly, change } = c;
  return (
    <div
      className={cx("fg-cond-group", depth > 1 && "fg-cond-nested", className)}
      role="group"
      aria-label={depth === 1 ? c.label : "Group"}
    >
      {group.rules.length === 0 ? (
        <div className="fg-cond-empty">
          {depth === 1 ? "Always true: no condition yet" : "Empty group"}
        </div>
      ) : null}
      {group.rules.map((rule, i) => (
        <div className="fg-cond-row" key={rule.id}>
          <span className="fg-cond-join">
            {i === 0 ? (
              <span className="fg-cond-word">Where</span>
            ) : i === 1 && !readOnly ? (
              <button
                type="button"
                className="fg-cond-switch"
                aria-label={`Match ${group.combinator === "and" ? "all" : "any"}; switch to ${group.combinator === "and" ? "or" : "and"}`}
                onClick={() =>
                  change(group.id, (g) => ({
                    ...g,
                    combinator: g.combinator === "and" ? "or" : "and",
                  }))
                }
              >
                {group.combinator}
              </button>
            ) : (
              <span className="fg-cond-word">{group.combinator}</span>
            )}
          </span>
          {isConditionGroup(rule) ? (
            <ConditionBuilderGroup group={rule} depth={depth + 1} parent={group} />
          ) : (
            <ConditionBuilderRule rule={rule} group={group} />
          )}
        </div>
      ))}
      {readOnly ? null : (
        <div className="fg-cond-foot">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => change(group.id, (g) => ({ ...g, rules: [...g.rules, c.newRule()] }))}
          >
            <Icon icon={PlusSignIcon} size={12} variant="mono" />
            Condition
          </Button>
          {depth < c.maxDepth ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                change(group.id, (g) => ({
                  ...g,
                  rules: [
                    ...g.rules,
                    {
                      id: nextId("g"),
                      combinator: g.combinator === "and" ? "or" : "and",
                      rules: [c.newRule()],
                    },
                  ],
                }))
              }
            >
              <Icon icon={PlusSignIcon} size={12} variant="mono" />
              Group
            </Button>
          ) : null}
          {parent ? (
            <Button
              size="sm"
              variant="ghost"
              className="fg-cond-drop"
              onClick={() =>
                change(parent.id, (g) => ({
                  ...g,
                  rules: g.rules.filter((r) => r.id !== group.id),
                }))
              }
            >
              Remove group
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export interface ConditionBuilderRuleProps {
  rule: ConditionRule;
  /** The group the rule is in: edits and Remove go through it. */
  group: ConditionGroup;
  className?: string;
}

/** One rule: the field, the operator, the value, and a button that removes it. */
export function ConditionBuilderRule({ rule, group, className }: ConditionBuilderRuleProps) {
  const { fields, variables, readOnly, change } = useCondition();
  const onChange = (next: ConditionRule) =>
    change(group.id, (g) => ({
      ...g,
      rules: g.rules.map((r) => (r.id === rule.id ? next : r)),
    }));
  const onRemove = () =>
    change(group.id, (g) => ({ ...g, rules: g.rules.filter((r) => r.id !== rule.id) }));
  const field = fields.find((f) => f.id === rule.field);
  const type = field?.type ?? "text";
  const operators = OPERATORS_BY_TYPE[type];
  const fieldName = field?.label ?? rule.field;
  const valueLabel = `Value of ${fieldName}`;
  let control = null;
  if (operatorTakesValue(rule.operator)) {
    if (type === "enum" && field?.options) {
      control = (
        <SelectMenu
          label={valueLabel}
          options={field.options}
          value={rule.value || null}
          onChange={(v) => onChange({ ...rule, value: v ?? "" })}
          placeholder="Value…"
          disabled={readOnly}
        />
      );
    } else if (variables && type !== "date") {
      control = (
        <ExpressionInput
          aria-label={valueLabel}
          variables={variables}
          value={rule.value ?? ""}
          onChange={(v) => onChange({ ...rule, value: v })}
          placeholder={type === "number" ? "0" : "Value"}
          disabled={readOnly}
        />
      );
    } else {
      control = (
        <Input
          aria-label={valueLabel}
          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
          mono={type !== "text"}
          value={rule.value ?? ""}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          placeholder={type === "number" ? "0" : "Value"}
          disabled={readOnly}
        />
      );
    }
  }
  return (
    <div className={cx("fg-cond-rule", className)}>
      <SelectMenu
        className="fg-cond-field"
        label="Field"
        options={fields.map((f) => ({
          value: f.id,
          label: f.label,
          ...(f.icon ? { icon: f.icon } : {}),
        }))}
        value={rule.field}
        disabled={readOnly}
        onChange={(id) => {
          const next = fields.find((f) => f.id === id);
          if (!next) return;
          const ops = OPERATORS_BY_TYPE[next.type];
          onChange({
            ...rule,
            field: next.id,
            operator: ops.includes(rule.operator) ? rule.operator : ops[0]!,
            value: next.type === type ? rule.value : "",
          });
        }}
      />
      <SelectMenu
        className="fg-cond-op"
        label={`Operator for ${fieldName}`}
        options={operators.map((op) => ({ value: op, label: OPERATOR_LABELS[op] }))}
        value={rule.operator}
        disabled={readOnly}
        onChange={(op) => {
          const found = operators.find((o) => o === op);
          if (found) onChange({ ...rule, operator: found });
        }}
      />
      <span className="fg-cond-value">{control}</span>
      {readOnly ? null : (
        <IconButton
          icon={Cancel01Icon}
          label={`Remove the condition on ${fieldName}`}
          size="sm"
          onClick={onRemove}
        />
      )}
    </div>
  );
}
