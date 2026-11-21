// A text field that takes references to what earlier steps gave, after the expression fields of
// the Flows prototype. Typing `{{` (or the `{{ }}` button) opens the outputs of the previous
// steps, grouped by step; Enter writes `{{ deal.amount }}`. References read as chips in the text,
// and, given sample data, the line under the field says what the text becomes.
// The text stays plain: the chips are drawn on a layer behind a transparent input of the same font.
// With children, `ExpressionInput` is the root of its parts (`ExpressionInputBox`, `ExpressionInputField`,
// `ExpressionInputTrigger`, `ExpressionInputList`, `ExpressionInputPreview`); without, the props-driven
// field built from them (D-157).

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  findTokens,
  insertToken,
  resolveTemplate,
  tokenQueryAt,
  type VariableField,
  type VariableSource,
} from "./template-model";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

type Part<T> = Omit<T, "className"> & { className?: string };

export interface ExpressionInputProps extends Omit<
  ComponentProps<"div">,
  | "className"
  | "children"
  | "defaultValue"
  | "onChange"
  | "id"
  | "placeholder"
  | "aria-label"
  | "aria-describedby"
  | "aria-invalid"
> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** The outputs of the previous steps, nearest first. */
  variables: ReadonlyArray<VariableSource>;
  /** A textarea of `rows` lines in place of a one-line input. */
  multiline?: boolean;
  rows?: number;
  /** The data of a test run: the line under the field shows what the text resolves to. */
  sample?: unknown;
  placeholder?: string;
  disabled?: boolean;
  /** From Field: ties the control to its label, hint and error. */
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: true | undefined;
  /** Names the control when no label does. */
  "aria-label"?: string;
  /** The parts of a composed field. Without them, the field draws all of its parts. */
  children?: ReactNode;
  className?: string;
}

interface Query {
  from: number;
  query: string;
}

interface Option {
  source: VariableSource;
  field: VariableField;
}

interface ExpressionState {
  value: string;
  setValue: (value: string) => void;
  variables: ReadonlyArray<VariableSource>;
  multiline: boolean | undefined;
  rows: number;
  placeholder: string | undefined;
  disabled: boolean | undefined;
  id: string | undefined;
  describedBy: string | undefined;
  invalid: true | undefined;
  ariaLabel: string | undefined;
  listId: string;
  optionId: (i: number) => string;
  options: Option[];
  open: boolean;
  current: number;
  setActive: (i: number) => void;
  pick: (path: string) => void;
  openList: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  look: (text: string, caret: number | null) => void;
  closeList: () => void;
  tokens: ReturnType<typeof findTokens>;
  resolved: ReturnType<typeof resolveTemplate> | null;
}

const ExpressionContext = createContext<ExpressionState | null>(null);
/** The control and the layer of chips behind it, shared with the part that places them. */
const ControlContext = createContext<RefObject<
  (HTMLInputElement & HTMLTextAreaElement) | null
> | null>(null);
const MirrorContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

function useExpression(): ExpressionState {
  const state = useContext(ExpressionContext);
  if (!state) throw new Error("ExpressionInput parts go inside <ExpressionInput>.");
  return state;
}

/** Keeps the layer of chips aligned with the control while it scrolls. */
function syncMirror(mirror: RefObject<HTMLDivElement | null> | null, from: HTMLElement) {
  if (!mirror?.current) return;
  mirror.current.scrollTop = from.scrollTop;
  mirror.current.scrollLeft = from.scrollLeft;
}

const shown = (v: unknown) =>
  v === undefined ? "undefined" : typeof v === "object" ? JSON.stringify(v) : String(v);

/**
 * Text with `{{ references }}` to earlier steps, picked from a list as they are typed. With
 * children: the root of the parts; without: the field, its button, its list and its preview.
 */
export function ExpressionInput({
  value: valueProp,
  defaultValue = "",
  onChange,
  variables,
  multiline,
  rows = 3,
  sample,
  placeholder,
  disabled,
  id: idProp,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  "aria-label": ariaLabel,
  children,
  className,
  ...rest
}: ExpressionInputProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const [value, setValue] = useControllableState({ value: valueProp, defaultValue, onChange });
  const [query, setQuery] = useState<Query | null>(null);
  const [active, setActive] = useState(0);
  const control = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const caretAfter = useRef<number | null>(null);

  // Puts the caret after a reference once the new text is in the control.
  useLayoutEffect(() => {
    const at = caretAfter.current;
    if (at === null || !control.current) return;
    caretAfter.current = null;
    control.current.focus();
    control.current.setSelectionRange(at, at);
  });

  const options = useMemo<Option[]>(() => {
    if (!query) return [];
    const q = query.query.toLowerCase();
    return variables.flatMap((source) =>
      source.fields
        .filter((f) => {
          const p = f.path.toLowerCase();
          return !q || p.startsWith(q) || p.includes(`.${q}`) || p.includes(q);
        })
        .map((field) => ({ source, field })),
    );
  }, [query, variables]);
  const open = query !== null && options.length > 0;
  const current = Math.min(active, Math.max(options.length - 1, 0));
  const optionId = (i: number) => `${uid}-o${i}`;

  const look = (text: string, caret: number | null) => {
    const q = caret === null ? null : tokenQueryAt(text, caret);
    setQuery(q);
    if (!q || q.query !== query?.query) setActive(0);
  };

  const pick = (path: string) => {
    if (!query || !control.current) return;
    const caret = control.current.selectionStart ?? query.from + query.query.length;
    const next = insertToken(value, query.from, caret, path);
    caretAfter.current = next.caret;
    setValue(next.text);
    setQuery(null);
  };

  const openList = () => {
    const el = control.current;
    if (!el || disabled) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const inside = tokenQueryAt(value, start);
    if (inside) {
      el.focus();
      setQuery(inside);
      return;
    }
    const text = `${value.slice(0, start)}{{ ${value.slice(end)}`;
    caretAfter.current = start + 3;
    setValue(text);
    setQuery({ from: start + 3, query: "" });
    setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next =
        event.key === "ArrowDown"
          ? Math.min(current + 1, options.length - 1)
          : Math.max(current - 1, 0);
      setActive(next);
      document.getElementById(optionId(next))?.scrollIntoView?.({ block: "nearest" });
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const option = options[current];
      if (option) pick(option.field.path);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setQuery(null);
    }
  };

  const tokens = findTokens(value);
  const resolved =
    sample !== undefined && tokens.length > 0 ? resolveTemplate(value, sample) : null;

  const state: ExpressionState = {
    value,
    setValue,
    variables,
    multiline,
    rows,
    placeholder,
    disabled,
    id: idProp,
    describedBy,
    invalid,
    ariaLabel,
    listId,
    optionId,
    options,
    open,
    current,
    setActive,
    pick,
    openList,
    onKeyDown,
    look,
    closeList: () => setQuery(null),
    tokens,
    resolved,
  };

  return (
    <ExpressionContext.Provider value={state}>
      <ControlContext.Provider value={control}>
        <MirrorContext.Provider value={mirror}>
          <div
            data-slot="expression-input"
            {...rest}
            className={cx(
              "fg-expr",
              multiline && "fg-expr-multi",
              disabled && "fg-expr-disabled",
              className,
            )}
          >
            {children ?? (
              <>
                <ExpressionInputBox>
                  <ExpressionInputField />
                  <ExpressionInputTrigger />
                  <ExpressionInputList />
                </ExpressionInputBox>
                <ExpressionInputPreview />
              </>
            )}
          </div>
        </MirrorContext.Provider>
      </ControlContext.Provider>
    </ExpressionContext.Provider>
  );
}

/** The frame that holds the field, its button and its list. */
export function ExpressionInputBox({ className, ...rest }: Part<ComponentProps<"div">>) {
  return (
    <div data-slot="expression-input-box" {...rest} className={cx("fg-expr-box", className)} />
  );
}

/** The control, with the layer behind it that draws the references as chips. */
export function ExpressionInputField({
  className,
  ...rest
}: Part<Omit<ComponentProps<"input">, "value" | "type">>) {
  const x = useExpression();
  const control = useContext(ControlContext);
  const mirror = useContext(MirrorContext);
  // The text with its references as chips, on the layer behind the control.
  const layer: Array<string | { text: string; at: number }> = [];
  let at = 0;
  for (const t of x.tokens) {
    if (t.from > at) layer.push(x.value.slice(at, t.from));
    layer.push({ text: x.value.slice(t.from, t.to), at: t.from });
    at = t.to;
  }
  layer.push(`${x.value.slice(at)}${x.multiline ? "\n" : ""}`);

  const shared = {
    "data-slot": "expression-input-field",
    ...rest,
    id: x.id,
    ref: control,
    className: cx("fg-expr-control", className),
    value: x.value,
    placeholder: x.placeholder,
    disabled: x.disabled,
    spellCheck: false,
    autoComplete: "off",
    role: "combobox",
    "aria-expanded": x.open,
    "aria-controls": x.listId,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": x.open ? x.optionId(x.current) : undefined,
    "aria-describedby": x.describedBy,
    "aria-invalid": x.invalid,
    "aria-label": x.ariaLabel,
    onKeyDown: x.onKeyDown,
    onChange: (e: { target: HTMLInputElement | HTMLTextAreaElement }) => {
      x.setValue(e.target.value);
      x.look(e.target.value, e.target.selectionStart);
    },
    onClick: (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
      x.look(e.currentTarget.value, e.currentTarget.selectionStart),
    onKeyUp: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End")
        x.look(e.currentTarget.value, e.currentTarget.selectionStart);
    },
    onBlur: x.closeList,
    onScroll: (e: { currentTarget: HTMLElement }) => syncMirror(mirror, e.currentTarget),
  };

  return (
    <>
      <div ref={mirror} className="fg-expr-mirror" aria-hidden="true">
        {layer.map((part) =>
          typeof part === "string" ? (
            part
          ) : (
            <mark key={part.at} className="fg-expr-token">
              {part.text}
            </mark>
          ),
        )}
      </div>
      {x.multiline ? (
        <textarea {...(shared as ComponentProps<"textarea">)} rows={x.rows} />
      ) : (
        <input {...shared} type="text" />
      )}
    </>
  );
}

/** The `{{ }}` button: opens the list of references at the caret. */
export function ExpressionInputTrigger({
  className,
  ...rest
}: Part<Omit<ComponentProps<"button">, "type">>) {
  const x = useExpression();
  return (
    <button
      data-slot="expression-input-trigger"
      {...rest}
      type="button"
      className={cx("fg-expr-fx", x.tokens.length > 0 && "fg-expr-fx-on", className)}
      aria-label="Insert a reference to a previous step"
      title="Insert a reference to a previous step"
      disabled={x.disabled}
      onPointerDown={(e) => e.preventDefault()}
      onClick={x.openList}
    >
      {"{{ }}"}
    </button>
  );
}

/** The outputs of the previous steps that match what is typed, grouped by step. */
export function ExpressionInputList({ className, ...rest }: Part<ComponentProps<"div">>) {
  const x = useExpression();
  if (!x.open) return null;
  return (
    <div
      data-slot="expression-input-list"
      role="listbox"
      aria-label="Outputs of previous steps"
      {...rest}
      className={cx("fg-expr-pop fg-pop", className)}
      id={x.listId}
    >
      {x.variables.map((source) => {
        const rowsOf = x.options.filter((o) => o.source === source);
        if (rowsOf.length === 0) return null;
        return (
          <div key={source.id} role="group" aria-label={source.label}>
            <div data-slot="expression-input-group" className="fg-expr-group">
              {source.icon ? <Icon icon={source.icon} size={12} variant="mono" /> : null}
              <span>{source.label}</span>
            </div>
            {rowsOf.map(({ field }) => {
              const i = x.options.findIndex((o) => o.source === source && o.field === field);
              return (
                <div
                  key={field.path}
                  id={x.optionId(i)}
                  role="option"
                  aria-selected={i === x.current}
                  data-slot="expression-input-option"
                  className="fg-expr-option"
                  onPointerDown={(e) => e.preventDefault()}
                  onPointerMove={() => i !== x.current && x.setActive(i)}
                  onClick={() => x.pick(field.path)}
                >
                  <span className="fg-expr-path">{field.path}</span>
                  {field.hint ? <span className="fg-expr-hint">{field.hint}</span> : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** What the text becomes with the sample data; nothing without a sample or a reference. */
export function ExpressionInputPreview({ className, ...rest }: Part<ComponentProps<"div">>) {
  const { resolved } = useExpression();
  if (!resolved) return null;
  return (
    <div
      data-slot="expression-input-preview"
      {...rest}
      className={cx(
        "fg-expr-preview",
        resolved.missing.length > 0 && "fg-expr-preview-bad",
        className,
      )}
    >
      <span aria-hidden="true">→ </span>
      <span className="fg-sr">Gives </span>
      {resolved.missing.length > 0 ? (
        <b>{`${resolved.missing.join(", ")} ${resolved.missing.length > 1 ? "are" : "is"} not in the sample`}</b>
      ) : (
        <b>{shown(resolved.value)}</b>
      )}
    </div>
  );
}
