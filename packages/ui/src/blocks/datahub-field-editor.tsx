// One field of a table, edited: its name and type, the options of its type (the choices of a
// select, the table of a relation, the decimals of a number), its rules (required, unique) and its
// default value. The caller puts it in a Drawer, a Modal or a popover and saves what it returns.

import { Cancel01Icon, PlusSignIcon } from "@forgeron/icons";
import type { FormEvent, KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import { Button } from "../button";
import { Switch } from "../controls";
import { cx } from "../cx";
import { Input } from "../form";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { SelectMenu } from "../overlays";
import { useControllableState } from "../hooks/use-controllable";
import { FieldInput } from "./datahub-field-input";
import { FieldTypePicker } from "./datahub-field-type";
import {
  FIELD_NAME,
  fieldNameError,
  validateValue,
  type DataField,
  type FieldChoice,
  type FieldType,
  type RelationSources,
} from "./datahub-model";

export interface FieldEditorTable {
  /** The table name a relation stores. */
  value: string;
  label: string;
}

export interface FieldEditorProps {
  /** The field. Controlled or not. */
  value?: DataField;
  defaultValue?: DataField;
  onChange?: (field: DataField) => void;
  /** Called with the field once its name and choices are valid. */
  onSubmit?: (field: DataField) => void;
  onCancel?: () => void;
  /** Adds a Delete button at the left of the foot. */
  onDelete?: () => void;
  /** The tables a relation can point at. */
  tables?: ReadonlyArray<FieldEditorTable>;
  /** The records a relation default can link, by table name. */
  relations?: RelationSources;
  /** The names of the other fields of the table: a name must not repeat one. */
  takenNames?: ReadonlyArray<string>;
  /** The types offered; all by default. */
  types?: ReadonlyArray<FieldType>;
  /** The shape of a name; snake_case by default, null for any. */
  namePattern?: RegExp | null;
  submitLabel?: string;
  /** Names the form for assistive technology. */
  label?: string;
  className?: string;
}

/** The colours a new choice cycles through, in the tokens of the theme. */
export const CHOICE_COLORS: ReadonlyArray<string> = [
  "var(--ink-dim)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--ink)",
];

const hasChoices = (type: FieldType) => type === "select" || type === "multiSelect";
const hasDefault = (field: DataField) =>
  !field.primary && field.type !== "file" && field.type !== "relation" && field.type !== "json";

/** What is wrong with the choices: none, an empty name, a name twice. */
export function choicesError(choices: ReadonlyArray<FieldChoice> | undefined): string | null {
  const list = choices ?? [];
  if (list.length === 0) return "Add at least one choice";
  if (list.some((c) => !c.label.trim())) return "Every choice needs a name";
  const seen = new Set<string>();
  for (const c of list) {
    const key = c.label.trim().toLowerCase();
    if (seen.has(key)) return `${c.label.trim()} is there twice`;
    seen.add(key);
  }
  return null;
}

/** A field edited: name, type, the options of its type, required, unique, default. */
export function FieldEditor({
  value,
  defaultValue = { id: "new", name: "", type: "text" },
  onChange,
  onSubmit,
  onCancel,
  onDelete,
  tables = [],
  relations,
  takenNames = [],
  types,
  namePattern = FIELD_NAME,
  submitLabel = "Save field",
  label = "Field",
  className,
}: FieldEditorProps) {
  const id = useId();
  const [field, setField] = useControllableState<DataField>({ value, defaultValue, onChange });
  const [tried, setTried] = useState(false);
  const patch = (next: Partial<DataField>) => setField({ ...field, ...next });

  const nameProblem = fieldNameError(field.name, takenNames, namePattern);
  const choiceProblem = hasChoices(field.type) ? choicesError(field.choices) : null;
  const relationProblem =
    field.type === "relation" && !field.relation?.table ? "Pick the table it points at" : null;
  const defaultProblem =
    hasDefault(field) && field.defaultValue != null
      ? validateValue({ ...field, required: false }, field.defaultValue)
      : null;

  const changeType = (type: FieldType) => {
    const next: DataField = { ...field, type };
    if (!hasChoices(type)) delete next.choices;
    else if (!next.choices?.length)
      next.choices = [{ value: "", label: "", color: CHOICE_COLORS[0]! }];
    if (type !== "relation") delete next.relation;
    else if (!next.relation && tables[0]) next.relation = { table: tables[0].value };
    if (type !== "number") delete next.decimals;
    if (next.defaultValue != null && (!hasDefault(next) || validateValue(next, next.defaultValue)))
      delete next.defaultValue;
    setField(next);
  };

  const submit = () => {
    setTried(true);
    if (nameProblem || choiceProblem || relationProblem || defaultProblem) return;
    const done: DataField = { ...field, name: field.name.trim() };
    if (done.choices)
      done.choices = done.choices.map((c) => ({
        ...c,
        label: c.label.trim(),
        value: c.value || c.label.trim(),
      }));
    onSubmit?.(done);
  };
  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };
  const show = (problem: string | null) => (tried ? problem : null);

  return (
    <form
      className={cx("fg-dh-fed", className)}
      aria-label={label}
      noValidate
      onSubmit={onFormSubmit}
      onKeyDown={onKeyDown}
    >
      <div className="fg-dh-fed-top">
        <div className="fg-field fg-dh-fed-name">
          <label className="fg-field-label" htmlFor={`${id}-name`}>
            Name
          </label>
          <Input
            id={`${id}-name`}
            mono
            autoComplete="off"
            spellCheck={false}
            placeholder="due_date"
            value={field.name}
            disabled={field.primary}
            onChange={(event) => patch({ name: event.target.value })}
            {...(show(nameProblem)
              ? { "aria-invalid": true, "aria-describedby": `${id}-name-error` }
              : {})}
          />
          {show(nameProblem) ? (
            <p id={`${id}-name-error`} className="fg-field-error">
              {nameProblem}
            </p>
          ) : null}
        </div>
        <div className="fg-dh-fed-type">
          <FieldTypePicker
            showLabel
            value={field.type}
            onChange={changeType}
            {...(types ? { types } : {})}
            {...(field.primary ? { disabled: true } : {})}
          />
        </div>
      </div>

      <div className="fg-field">
        <label className="fg-field-label" htmlFor={`${id}-desc`}>
          Description
        </label>
        <Input
          id={`${id}-desc`}
          placeholder="Optional, shown under the field in forms"
          value={field.description ?? ""}
          onChange={(event) => {
            const description = event.target.value;
            const next: DataField = { ...field, description };
            if (!description) delete next.description;
            setField(next);
          }}
        />
      </div>

      {hasChoices(field.type) ? (
        <ChoiceList
          choices={field.choices ?? []}
          onChange={(choices) => patch({ choices })}
          problem={show(choiceProblem)}
        />
      ) : null}

      {field.type === "relation" ? (
        <div className="fg-dh-fed-row">
          <SelectMenu
            label="Points at"
            showLabel
            placeholder="Pick a table"
            options={tables.map((t) => ({ value: t.value, label: t.label, hint: t.value }))}
            value={field.relation?.table ?? null}
            onChange={(table) => {
              if (table) patch({ relation: { ...field.relation, table } });
            }}
          />
          <Switch
            label="Several records"
            checked={field.relation?.multiple ?? false}
            onChange={(event) =>
              patch({
                relation: { table: field.relation?.table ?? "", multiple: event.target.checked },
              })
            }
          />
          {show(relationProblem) ? <p className="fg-field-error">{relationProblem}</p> : null}
        </div>
      ) : null}

      {field.type === "number" ? (
        <SelectMenu
          label="Decimals"
          showLabel
          options={[
            { value: "any", label: "Any" },
            ...[0, 1, 2, 3, 4].map((n) => ({
              value: String(n),
              label: n === 0 ? "Whole numbers" : String(n),
              hint: n === 0 ? "1" : (1).toFixed(n),
            })),
          ]}
          value={field.decimals === undefined ? "any" : String(field.decimals)}
          onChange={(next) => {
            const nextField = { ...field };
            if (!next || next === "any") delete nextField.decimals;
            else nextField.decimals = Number(next);
            setField(nextField);
          }}
        />
      ) : null}

      <fieldset className="fg-dh-fed-rules">
        <legend className="fg-field-label">Rules</legend>
        <Switch
          label="Required"
          checked={field.required ?? false}
          disabled={field.primary}
          onChange={(event) => patch({ required: event.target.checked })}
        />
        <Switch
          label="Unique"
          checked={field.unique ?? false}
          disabled={field.primary}
          onChange={(event) => patch({ unique: event.target.checked })}
        />
      </fieldset>

      {hasDefault(field) ? (
        <div className="fg-field">
          <label className="fg-field-label" htmlFor={`${id}-default`}>
            Default value
          </label>
          <FieldInput
            field={{ ...field, required: false }}
            label="Default value"
            id={`${id}-default`}
            value={field.defaultValue ?? null}
            onChange={(next) => {
              const nextField = { ...field };
              if (next === null) delete nextField.defaultValue;
              else nextField.defaultValue = next;
              setField(nextField);
            }}
            {...(relations ? { relations } : {})}
            {...(show(defaultProblem) ? { invalid: true } : {})}
          />
          {show(defaultProblem) ? <p className="fg-field-error">{defaultProblem}</p> : null}
        </div>
      ) : null}

      {onSubmit || onCancel || onDelete ? (
        <div className="fg-dh-form-foot">
          {onDelete ? (
            <Button variant="danger" onClick={onDelete}>
              Delete field
            </Button>
          ) : null}
          <span className="fg-dh-spacer" />
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          {onSubmit ? (
            <Button type="submit" variant="primary" kbd="⌘↵">
              {submitLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

interface ChoiceListProps {
  choices: ReadonlyArray<FieldChoice>;
  onChange: (choices: FieldChoice[]) => void;
  problem: string | null;
}

/** The choices of a select: a colour, a name, a remove button; Enter adds the next one. */
function ChoiceList({ choices, onChange, problem }: ChoiceListProps) {
  const id = useId();
  const focusAt = useRef<number | null>(null);
  const set = (at: number, next: Partial<FieldChoice>) =>
    onChange(choices.map((c, i) => (i === at ? { ...c, ...next } : c)));
  const add = (at: number) => {
    focusAt.current = at;
    const color = CHOICE_COLORS[(choices.length + 1) % CHOICE_COLORS.length]!;
    onChange([...choices.slice(0, at), { value: "", label: "", color }, ...choices.slice(at)]);
  };
  const remove = (at: number) => {
    focusAt.current = Math.max(0, at - 1);
    onChange(choices.filter((_, i) => i !== at));
  };
  return (
    <fieldset className="fg-dh-choices" aria-describedby={problem ? `${id}-error` : undefined}>
      <legend className="fg-field-label">Choices</legend>
      <ol className="fg-dh-choice-list">
        {choices.map((choice, at) => (
          <li key={at} className="fg-dh-choice">
            <button
              type="button"
              className="fg-dh-choice-color"
              aria-label={`Colour of ${choice.label || "this choice"}: change`}
              onClick={() => {
                const now = CHOICE_COLORS.indexOf(choice.color ?? "");
                set(at, { color: CHOICE_COLORS[(now + 1) % CHOICE_COLORS.length]! });
              }}
            >
              <span
                className="fg-swatch-mark"
                style={{ background: choice.color ?? "var(--ink-dim)" }}
              />
            </button>
            <input
              ref={(input) => {
                if (input && focusAt.current === at) {
                  focusAt.current = null;
                  input.focus({ preventScroll: true });
                }
              }}
              aria-label={`Choice ${at + 1}`}
              placeholder="Name"
              value={choice.label}
              onChange={(event) => {
                const label = event.target.value;
                // A choice's value follows its name until it is saved; after, it stays stable.
                const follows = choice.value === "" || choice.value === choice.label;
                set(at, follows ? { label, value: label } : { label });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
                  event.preventDefault();
                  add(at + 1);
                }
                if (event.key === "Backspace" && choice.label === "" && choices.length > 1) {
                  event.preventDefault();
                  remove(at);
                }
              }}
              className="fg-input fg-dh-choice-input"
            />
            <IconButton
              icon={Cancel01Icon}
              size="sm"
              label={`Remove ${choice.label || `choice ${at + 1}`}`}
              onClick={() => remove(at)}
            />
          </li>
        ))}
      </ol>
      <Button size="sm" variant="ghost" onClick={() => add(choices.length)}>
        <Icon icon={PlusSignIcon} size={12} variant="mono" />
        Add a choice
      </Button>
      {problem ? (
        <p id={`${id}-error`} className="fg-field-error">
          {problem}
        </p>
      ) : null}
    </fieldset>
  );
}
