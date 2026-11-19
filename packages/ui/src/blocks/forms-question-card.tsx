// One question of a form, edited where it stands: title, help, type, required, the options of a
// choice (or the rows and columns of a matrix), the limits of the answer. Closed it is a row with
// a handle: drag it, or Alt + Up and Alt + Down on the row, to move it; duplicate and delete sit at
// its end. The logic (show-if) is a slot, so the card knows nothing of the other questions.

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Copy01Icon,
  Delete04Icon,
  GripIcon,
  PlusSignIcon,
} from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useId, useRef } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Field, Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Switch } from "../controls";
import { NumberInput } from "../numbers";
import { DatePicker, SelectMenu } from "../overlays";
import {
  FORM_QUESTION_TYPES,
  convertFormQuestion,
  formQuestionInfo,
  freshFormId,
  isChoiceType,
  moveFormItem,
  newFormQuestion,
  type FormOption,
  type FormQuestion,
  type FormRange,
  type FormValidation,
  type QuestionType,
} from "./forms-model";

/* ---------------------------------------------------------------- The options editor */

interface OptionsEditorProps {
  label: string;
  /** What one entry is called: "Option", "Item", "Row", "Column". */
  noun: string;
  value: FormOption[];
  onChange: (next: FormOption[]) => void;
  taken: string[];
  min?: number;
  disabled?: boolean;
}

/** A list of labelled entries: type, Enter adds the next, Alt + arrows move, an empty one goes on Backspace. */
function OptionsEditor({
  label,
  noun,
  value,
  onChange,
  taken,
  min = 1,
  disabled,
}: OptionsEditorProps) {
  const list = useRef<HTMLUListElement>(null);
  const focusAt = (id: string) =>
    requestAnimationFrame(() =>
      list.current
        ?.querySelector<HTMLInputElement>(`[data-option="${CSS.escape(id)}"] input`)
        ?.focus(),
    );
  const add = (after?: number) => {
    const id = freshFormId("o", [...taken, ...value.map((o) => o.id)]);
    const at = after === undefined ? value.length : after + 1;
    onChange([...value.slice(0, at), { id, label: "" }, ...value.slice(at)]);
    focusAt(id);
  };
  const edit = (id: string, text: string) =>
    onChange(value.map((o) => (o.id === id ? { ...o, label: text } : o)));
  const remove = (index: number) => {
    if (value.length <= min) return;
    onChange(value.filter((_, i) => i !== index));
    const near = value[index + 1] ?? value[index - 1];
    if (near) focusAt(near.id);
  };
  const move = (index: number, to: number) => onChange(moveFormItem(value, index, to));
  const onKey = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    const o = value[index]!;
    if (event.key === "Enter") {
      event.preventDefault();
      add(index);
    } else if (event.key === "Backspace" && o.label === "" && value.length > min) {
      event.preventDefault();
      remove(index);
    } else if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      move(index, index + (event.key === "ArrowUp" ? -1 : 1));
      focusAt(o.id);
    }
  };
  return (
    <fieldset className="fg-fm-opts" disabled={disabled}>
      <legend className="fg-field-label">{label}</legend>
      <ul ref={list} className="fg-fm-opts-list">
        {value.map((o, i) => (
          <li key={o.id} data-option={o.id} className="fg-fm-opt">
            <Input
              value={o.label}
              placeholder={`${noun} ${i + 1}`}
              aria-label={`${noun} ${i + 1}`}
              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
              onChange={(event) => edit(o.id, event.target.value)}
              onKeyDown={(event) => onKey(event, i)}
            />
            <IconButton
              icon={ArrowUp01Icon}
              size="sm"
              label={`Move ${noun.toLowerCase()} ${i + 1} up`}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            />
            <IconButton
              icon={ArrowDown01Icon}
              size="sm"
              label={`Move ${noun.toLowerCase()} ${i + 1} down`}
              disabled={i === value.length - 1}
              onClick={() => move(i, i + 1)}
            />
            <IconButton
              icon={Cancel01Icon}
              size="sm"
              label={`Remove ${noun.toLowerCase()} ${i + 1}`}
              disabled={value.length <= min}
              onClick={() => remove(i)}
            />
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="fg-fm-opts-add" onClick={() => add()}>
        <Icon icon={PlusSignIcon} size={12} variant="mono" />
        Add {noun.toLowerCase()}
      </Button>
    </fieldset>
  );
}

/* ---------------------------------------------------------------- The limits of an answer */

function numberField(
  label: string,
  value: number | undefined,
  onChange: (v: number | undefined) => void,
  extra: { min?: number; max?: number; disabled?: boolean } = {},
) {
  return (
    <Field label={label} className="fg-fm-qc-num">
      {(control) => (
        <NumberInput
          id={control.id}
          label={label}
          value={value ?? null}
          onChange={(v) => onChange(v === null ? undefined : v)}
          {...(extra.min !== undefined ? { min: extra.min } : {})}
          {...(extra.max !== undefined ? { max: extra.max } : {})}
          {...(extra.disabled ? { disabled: true } : {})}
        />
      )}
    </Field>
  );
}

interface LimitsProps {
  q: FormQuestion;
  set: (key: keyof FormValidation, value: FormValidation[keyof FormValidation] | undefined) => void;
  disabled?: boolean;
}

function Limits({ q, set, disabled }: LimitsProps) {
  const v = q.validation ?? {};
  const d = disabled ? { disabled: true } : {};
  switch (q.type) {
    case "shortText":
    case "longText":
      return (
        <div className="fg-fm-qc-grid">
          {q.type === "shortText" ? (
            <SelectMenu
              label="Format"
              showLabel
              options={[
                { value: "none", label: "Any text" },
                { value: "email", label: "Email address" },
                { value: "url", label: "Link" },
              ]}
              value={v.format ?? "none"}
              onChange={(next) =>
                set("format", next === "email" || next === "url" ? next : undefined)
              }
              {...d}
            />
          ) : null}
          {numberField("Shortest", v.minLength, (x) => set("minLength", x), { min: 0, ...d })}
          {numberField("Longest", v.maxLength, (x) => set("maxLength", x), { min: 1, ...d })}
          {q.type === "shortText" ? (
            <>
              <Field label="Pattern">
                {(control) => (
                  <Input
                    {...control}
                    mono
                    value={v.pattern ?? ""}
                    placeholder="[A-Z]{2}[0-9]{4}"
                    onChange={(event) => set("pattern", event.target.value || undefined)}
                    {...d}
                  />
                )}
              </Field>
              {v.pattern ? (
                <Field label="Message when it does not match">
                  {(control) => (
                    <Input
                      {...control}
                      value={v.patternMessage ?? ""}
                      onChange={(event) => set("patternMessage", event.target.value || undefined)}
                      {...d}
                    />
                  )}
                </Field>
              ) : null}
            </>
          ) : null}
        </div>
      );
    case "number":
      return (
        <div className="fg-fm-qc-grid">
          {numberField("Minimum", v.min, (x) => set("min", x), d)}
          {numberField("Maximum", v.max, (x) => set("max", x), d)}
          <Switch
            label="Whole numbers only"
            checked={v.integer === true}
            onChange={(event) => set("integer", event.target.checked || undefined)}
            {...d}
          />
        </div>
      );
    case "multiChoice":
      return (
        <div className="fg-fm-qc-grid">
          {numberField("At least", v.minSelected, (x) => set("minSelected", x), { min: 0, ...d })}
          {numberField("At most", v.maxSelected, (x) => set("maxSelected", x), { min: 1, ...d })}
        </div>
      );
    case "date":
      return (
        <div className="fg-fm-qc-grid">
          <Field label="Earliest day">
            {() => (
              <DatePicker
                label="Earliest day"
                variant="field"
                presets={[]}
                clearable
                placeholder="Any"
                value={v.minDate ?? null}
                onChange={(x) => set("minDate", x ?? undefined)}
              />
            )}
          </Field>
          <Field label="Latest day">
            {() => (
              <DatePicker
                label="Latest day"
                variant="field"
                presets={[]}
                clearable
                placeholder="Any"
                value={v.maxDate ?? null}
                onChange={(x) => set("maxDate", x ?? undefined)}
              />
            )}
          </Field>
        </div>
      );
    case "file":
      return (
        <div className="fg-fm-qc-grid">
          {numberField("Most files", v.maxFiles, (x) => set("maxFiles", x), { min: 1, ...d })}
          {numberField("Largest file (MB)", v.maxSizeMb, (x) => set("maxSizeMb", x), {
            min: 1,
            ...d,
          })}
          <Field label="Accepted types" hint="Like image/*,.pdf. Empty takes any.">
            {(control) => (
              <Input
                {...control}
                mono
                value={v.accept ?? ""}
                onChange={(event) => set("accept", event.target.value || undefined)}
                {...d}
              />
            )}
          </Field>
        </div>
      );
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- The card */

export interface QuestionCardProps {
  /** The question. Controlled or not. */
  value?: FormQuestion;
  defaultValue?: FormQuestion;
  onChange?: (question: FormQuestion) => void;
  /** Its number in the form, shown in the row. */
  index?: number;
  /** Opens the card. Controlled or not. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  /** Alt + Up and Alt + Down on the row, and the arrows of an open card. Absent: no reordering. */
  onMove?: (delta: -1 | 1) => void;
  /** Makes the handle draggable; the parent owns the drop targets. */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** What is wrong with the question, said as what to do. */
  problems?: ReadonlyArray<string>;
  /** Every id of the form, so the options made here never collide. */
  takenIds?: ReadonlyArray<string>;
  /** Under the limits: the show-if of the question. */
  logic?: ReactNode;
  /** A mark in the row when the question has a show-if rule. */
  hasLogic?: boolean;
  /** Text only, no controls. */
  readOnly?: boolean;
  className?: string;
}

const RANGE_FROM = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
];

/** A question edited in place, behind a row with a handle. */
export function QuestionCard({
  value,
  defaultValue,
  onChange,
  index,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onDuplicate,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd,
  problems = [],
  takenIds = [],
  logic,
  hasLogic,
  readOnly,
  className,
}: QuestionCardProps) {
  const [q, setQ] = useControllableState<FormQuestion>({
    value,
    defaultValue: defaultValue ?? newFormQuestion("shortText", "q1"),
    onChange,
  });
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const uid = useId();
  const info = formQuestionInfo(q.type);
  const patch = (next: Partial<FormQuestion>) => setQ({ ...q, ...next });
  const taken = [...takenIds, q.id];
  const setLimit: LimitsProps["set"] = (key, val) => {
    const next = { ...(q.validation ?? {}) } as Record<string, unknown>;
    if (val === undefined || val === "") delete next[key];
    else next[key] = val;
    const { validation: _old, ...rest } = q;
    setQ(Object.keys(next).length ? { ...rest, validation: next as FormValidation } : rest);
  };
  const setRange = (r: Partial<FormRange>) => {
    const range = { ...(q.range ?? { min: 1, max: 5 }), ...r };
    patch({ range });
  };
  const dis = readOnly ? { disabled: true } : {};

  const onRowKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown") && onMove) {
      event.preventDefault();
      onMove(event.key === "ArrowUp" ? -1 : 1);
      const target = event.currentTarget;
      requestAnimationFrame(() => target.isConnected && target.focus());
    }
  };

  const title = q.title.trim();
  return (
    <section
      className={cx(
        "fg-fm-qc",
        open && "fg-fm-qc-open",
        problems.length > 0 && "fg-fm-qc-bad",
        className,
      )}
      aria-label={title || `Question ${index ?? ""}`.trim()}
      data-question={q.id}
    >
      <div className="fg-fm-qc-row">
        {onMove && !readOnly ? (
          <span
            className="fg-fm-qc-grip"
            aria-hidden="true"
            draggable={Boolean(onDragStart)}
            title="Drag to reorder, or Alt + arrows"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", title || info.label);
              onDragStart?.();
            }}
            onDragEnd={() => onDragEnd?.()}
          >
            <Icon icon={GripIcon} size={12} variant="mono" />
          </span>
        ) : null}
        <button
          type="button"
          className="fg-fm-qc-main"
          aria-expanded={open}
          aria-controls={`${uid}-body`}
          aria-keyshortcuts={onMove ? "Alt+ArrowUp Alt+ArrowDown" : undefined}
          onClick={() => setOpen(!open)}
          onKeyDown={onRowKey}
        >
          {index !== undefined ? <span className="fg-fm-qc-n">{index}</span> : null}
          <Icon icon={info.icon} size={12} variant="mono" className="fg-fm-qc-glyph" />
          <span className={cx("fg-fm-qc-title", !title && "fg-fm-qc-untitled")}>
            {title || "Untitled question"}
          </span>
          <span className="fg-fm-qc-type">{info.label}</span>
          {q.required ? <span className="fg-fm-qc-flag">Required</span> : null}
          {hasLogic ? <span className="fg-fm-qc-flag">Logic</span> : null}
          {problems.length ? (
            <span className="fg-fm-qc-flag fg-fm-qc-flag-bad">
              {problems.length} {problems.length === 1 ? "problem" : "problems"}
            </span>
          ) : null}
        </button>
        {!readOnly && onDuplicate ? (
          <IconButton
            icon={Copy01Icon}
            size="sm"
            label="Duplicate question"
            onClick={onDuplicate}
          />
        ) : null}
        {!readOnly && onDelete ? (
          <IconButton icon={Delete04Icon} size="sm" label="Delete question" onClick={onDelete} />
        ) : null}
      </div>
      {open ? (
        <div id={`${uid}-body`} className="fg-fm-qc-body">
          {problems.length ? (
            <ul className="fg-fm-qc-problems" aria-label="Problems with this question">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <Field label="Question">
            {(control) => (
              <Input
                {...control}
                value={q.title}
                placeholder="What do you want to ask?"
                onChange={(event) => patch({ title: event.target.value })}
                {...dis}
              />
            )}
          </Field>
          <Field label="Help text" hint="Shown under the question.">
            {(control) => (
              <Input
                {...control}
                value={q.help ?? ""}
                onChange={(event) => {
                  const { help: _h, ...rest } = q;
                  setQ(event.target.value ? { ...rest, help: event.target.value } : rest);
                }}
                {...dis}
              />
            )}
          </Field>
          <div className="fg-fm-qc-grid">
            <SelectMenu
              label="Type"
              showLabel
              options={FORM_QUESTION_TYPES.map((t) => ({
                value: t.type,
                label: t.label,
                icon: t.icon,
                hint: t.hint,
              }))}
              value={q.type}
              onChange={(next) => next && setQ(convertFormQuestion(q, next as QuestionType))}
              {...dis}
            />
            <div className="fg-fm-qc-req">
              <Switch
                label="Required"
                checked={q.required === true}
                onChange={(event) => {
                  const { required: _r, ...rest } = q;
                  setQ(event.target.checked ? { ...rest, required: true } : rest);
                }}
                {...dis}
              />
            </div>
          </div>
          {q.type === "shortText" || q.type === "longText" || q.type === "number" ? (
            <Field label="Placeholder">
              {(control) => (
                <Input
                  {...control}
                  value={q.placeholder ?? ""}
                  onChange={(event) => {
                    const { placeholder: _p, ...rest } = q;
                    setQ(event.target.value ? { ...rest, placeholder: event.target.value } : rest);
                  }}
                  {...dis}
                />
              )}
            </Field>
          ) : null}
          {isChoiceType(q.type) || q.type === "ranking" ? (
            <OptionsEditor
              label={q.type === "ranking" ? "Items to rank" : "Options"}
              noun={q.type === "ranking" ? "Item" : "Option"}
              value={q.options ?? []}
              onChange={(options) => patch({ options })}
              taken={taken}
              min={q.type === "ranking" ? 2 : 1}
              {...dis}
            />
          ) : null}
          {q.type === "matrix" ? (
            <>
              <OptionsEditor
                label="Rows"
                noun="Row"
                value={q.options ?? []}
                onChange={(options) => patch({ options })}
                taken={taken}
                {...dis}
              />
              <OptionsEditor
                label="Columns"
                noun="Column"
                value={q.columns ?? []}
                onChange={(columns) => patch({ columns })}
                taken={taken}
                min={2}
                {...dis}
              />
              <Switch
                label="Several columns per row"
                checked={q.multiple === true}
                onChange={(event) => {
                  const { multiple: _m, ...rest } = q;
                  setQ(event.target.checked ? { ...rest, multiple: true } : rest);
                }}
                {...dis}
              />
            </>
          ) : null}
          {q.type === "rating" ? (
            <div className="fg-fm-qc-grid">
              {numberField("Stars", q.range?.max ?? 5, (x) => setRange({ min: 1, max: x ?? 5 }), {
                min: 2,
                max: 10,
                ...dis,
              })}
            </div>
          ) : null}
          {q.type === "scale" ? (
            <div className="fg-fm-qc-grid">
              <Switch
                label="Net promoter score (0 to 10)"
                checked={q.range?.nps === true}
                onChange={(event) => {
                  if (event.target.checked)
                    patch({ range: { ...q.range, min: 0, max: 10, nps: true } });
                  else {
                    const { nps: _n, ...rest } = q.range ?? { min: 1, max: 5 };
                    patch({ range: { ...rest, min: 1, max: 5 } });
                  }
                }}
                {...dis}
              />
              {q.range?.nps ? null : (
                <>
                  <SelectMenu
                    label="From"
                    showLabel
                    options={RANGE_FROM}
                    value={String(q.range?.min ?? 1)}
                    onChange={(next) => next && setRange({ min: Number(next) })}
                    {...dis}
                  />
                  {numberField("To", q.range?.max ?? 5, (x) => setRange({ max: x ?? 5 }), {
                    min: 2,
                    max: 10,
                    ...dis,
                  })}
                </>
              )}
              <Field label="Low end label">
                {(control) => (
                  <Input
                    {...control}
                    value={q.range?.lowLabel ?? ""}
                    placeholder="Not at all"
                    onChange={(event) => {
                      const { lowLabel: _l, ...rest } = q.range ?? { min: 1, max: 5 };
                      patch({
                        range: event.target.value
                          ? { ...rest, lowLabel: event.target.value }
                          : rest,
                      });
                    }}
                    {...dis}
                  />
                )}
              </Field>
              <Field label="High end label">
                {(control) => (
                  <Input
                    {...control}
                    value={q.range?.highLabel ?? ""}
                    placeholder="Very much"
                    onChange={(event) => {
                      const { highLabel: _l, ...rest } = q.range ?? { min: 1, max: 5 };
                      patch({
                        range: event.target.value
                          ? { ...rest, highLabel: event.target.value }
                          : rest,
                      });
                    }}
                    {...dis}
                  />
                )}
              </Field>
            </div>
          ) : null}
          <Limits q={q} set={setLimit} disabled={readOnly} />
          {logic ? <div className="fg-fm-qc-logic">{logic}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
