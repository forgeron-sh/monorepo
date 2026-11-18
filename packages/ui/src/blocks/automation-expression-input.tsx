// A text field that takes references to what earlier steps gave, after the expression fields of
// the Flows prototype. Typing `{{` (or the `{{ }}` button) opens the outputs of the previous
// steps, grouped by step; Enter writes `{{ deal.amount }}`. References read as chips in the text,
// and, given sample data, the line under the field says what the text becomes.
// The text stays plain: the chips are drawn on a layer behind a transparent input of the same font.

import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useControllableState } from "../hooks/use-controllable";
import { cx } from "../cx";
import { Icon } from "../icon";
import {
  findTokens,
  insertToken,
  resolveTemplate,
  tokenQueryAt,
  type VariableSource,
} from "./automation-model";

export interface ExpressionInputProps {
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
  className?: string;
}

interface Query {
  from: number;
  query: string;
}

const shown = (v: unknown) =>
  v === undefined ? "undefined" : typeof v === "object" ? JSON.stringify(v) : String(v);

/** Text with `{{ references }}` to earlier steps, picked from a list as they are typed. */
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
  className,
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

  const options = useMemo(() => {
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

  // The text with its references as chips, on the layer behind the control.
  const tokens = findTokens(value);
  const layer: Array<string | { text: string; at: number }> = [];
  let at = 0;
  for (const t of tokens) {
    if (t.from > at) layer.push(value.slice(at, t.from));
    layer.push({ text: value.slice(t.from, t.to), at: t.from });
    at = t.to;
  }
  layer.push(`${value.slice(at)}${multiline ? "\n" : ""}`);

  const resolved =
    sample !== undefined && tokens.length > 0 ? resolveTemplate(value, sample) : null;

  const shared = {
    id: idProp,
    ref: control,
    className: "fg-expr-control",
    value,
    placeholder,
    disabled,
    spellCheck: false,
    autoComplete: "off",
    role: "combobox",
    "aria-expanded": open,
    "aria-controls": listId,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": open ? optionId(current) : undefined,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    "aria-label": ariaLabel,
    onKeyDown,
    onChange: (e: { target: HTMLInputElement | HTMLTextAreaElement }) => {
      setValue(e.target.value);
      look(e.target.value, e.target.selectionStart);
    },
    onClick: (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) =>
      look(e.currentTarget.value, e.currentTarget.selectionStart),
    onKeyUp: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End")
        look(e.currentTarget.value, e.currentTarget.selectionStart);
    },
    onBlur: () => setQuery(null),
    onScroll: (e: { currentTarget: HTMLElement }) => {
      if (!mirror.current) return;
      mirror.current.scrollTop = e.currentTarget.scrollTop;
      mirror.current.scrollLeft = e.currentTarget.scrollLeft;
    },
  };

  return (
    <div
      className={cx(
        "fg-expr",
        multiline && "fg-expr-multi",
        disabled && "fg-expr-disabled",
        className,
      )}
    >
      <div className="fg-expr-box">
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
        {multiline ? <textarea {...shared} rows={rows} /> : <input {...shared} type="text" />}
        <button
          type="button"
          className={cx("fg-expr-fx", tokens.length > 0 && "fg-expr-fx-on")}
          aria-label="Insert a reference to a previous step"
          title="Insert a reference to a previous step"
          disabled={disabled}
          onPointerDown={(e) => e.preventDefault()}
          onClick={openList}
        >
          {"{{ }}"}
        </button>
        {open ? (
          <div
            className="fg-expr-pop fg-pop"
            id={listId}
            role="listbox"
            aria-label="Outputs of previous steps"
          >
            {variables.map((source) => {
              const rowsOf = options.filter((o) => o.source === source);
              if (rowsOf.length === 0) return null;
              return (
                <div key={source.id} role="group" aria-label={source.label}>
                  <div className="fg-expr-group">
                    {source.icon ? <Icon icon={source.icon} size={12} variant="mono" /> : null}
                    <span>{source.label}</span>
                  </div>
                  {rowsOf.map(({ field }) => {
                    const i = options.findIndex((x) => x.source === source && x.field === field);
                    return (
                      <div
                        key={field.path}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === current}
                        className="fg-expr-option"
                        onPointerDown={(e) => e.preventDefault()}
                        onPointerMove={() => i !== current && setActive(i)}
                        onClick={() => pick(field.path)}
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
        ) : null}
      </div>
      {resolved ? (
        <div
          className={cx("fg-expr-preview", resolved.missing.length > 0 && "fg-expr-preview-bad")}
        >
          <span aria-hidden="true">→ </span>
          <span className="fg-sr">Gives </span>
          {resolved.missing.length > 0 ? (
            <b>{`${resolved.missing.join(", ")} ${resolved.missing.length > 1 ? "are" : "is"} not in the sample`}</b>
          ) : (
            <b>{shown(resolved.value)}</b>
          )}
        </div>
      ) : null}
    </div>
  );
}
