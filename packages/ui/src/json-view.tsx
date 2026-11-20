// The input or output of a step, after the run panels of the Flows prototype: JSON in mono, keys
// in ink, strings in green, numbers and booleans in amber, `null` dim. Selectable, scrolls past
// its height, copied whole with the button. With children, `JsonView` is the root of its parts
// (`JsonViewLabel`, `JsonViewContent`, `JsonViewCopy`, `JsonViewEmpty`); without, the props-driven
// view built from them (D-157).

import { Copy01Icon, Tick02Icon } from "@forgeron/icons";
import { createContext, useContext, useState, type ReactNode } from "react";
import { cx } from "./cx";
import { IconButton } from "./identity";

export interface JsonViewProps {
  /** Any value JSON can write; `undefined` shows `empty`. */
  value: unknown;
  /** Names the block for assistive technology, and is shown above it. */
  label?: string;
  /** Max height of the text in px before it scrolls; `none` for no limit. */
  maxHeight?: number | "none";
  /** The copy button at the top right. */
  copyable?: boolean;
  empty?: ReactNode;
  /** The parts of a composed view. Without them, the view draws all of its parts. */
  children?: ReactNode;
  className?: string;
}

const TOKEN =
  /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|\b(true|false)\b|\b(null)\b/g;

/** The spans of one JSON text: `k` key, `s` string, `n` number, `b` boolean, `z` null. */
export function highlightJson(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    const [all, str, colon, num, bool] = m;
    const kind = str ? (colon ? "k" : "s") : num ? "n" : bool ? "b" : "z";
    out.push(
      <span key={m.index} className={`fg-json-${kind}`}>
        {str && colon ? str : all}
      </span>,
    );
    if (str && colon) out.push(colon);
    at = m.index + all.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

interface JsonState {
  text: string | undefined;
  label: string | undefined;
  copied: boolean;
  copy: () => void;
  blur: () => void;
}

const JsonContext = createContext<JsonState | null>(null);

function useJson(): JsonState {
  const state = useContext(JsonContext);
  if (!state) throw new Error("JsonView parts go inside <JsonView>.");
  return state;
}

/**
 * JSON, coloured by kind, in a block that scrolls. With children: the root of the parts; without:
 * the label, the text and the copy button.
 */
export function JsonView({
  value,
  label,
  maxHeight = 320,
  copyable = true,
  empty = "No data",
  children,
  className,
}: JsonViewProps) {
  const [copied, setCopied] = useState(false);
  const text = value === undefined ? undefined : JSON.stringify(value, null, 2);
  const state: JsonState = {
    text,
    label,
    copied,
    copy: () => {
      if (text === undefined) return;
      void navigator.clipboard?.writeText(text).then(() => setCopied(true));
    },
    blur: () => setCopied(false),
  };
  return (
    <JsonContext.Provider value={state}>
      <figure className={cx("fg-json", className)}>
        {children ?? (
          <>
            <JsonViewLabel />
            <JsonViewContent maxHeight={maxHeight} empty={empty}>
              {copyable ? <JsonViewCopy /> : null}
            </JsonViewContent>
          </>
        )}
      </figure>
    </JsonContext.Provider>
  );
}

/** The caption above the text: the `label` of the view. Nothing without one. */
export function JsonViewLabel({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { label } = useJson();
  const words = children ?? label;
  return words ? <figcaption className={cx("fg-json-label", className)}>{words}</figcaption> : null;
}

export interface JsonViewContentProps {
  maxHeight?: number | "none";
  /** Shown when the value is `undefined`. */
  empty?: ReactNode;
  className?: string;
  /** Rendered next to the text, in its box: the copy button. */
  children?: ReactNode;
}

/** The coloured text, in a box that scrolls and can be reached from the keyboard. */
export function JsonViewContent({
  maxHeight = 320,
  empty = "No data",
  className,
  children,
}: JsonViewContentProps) {
  const { text, label } = useJson();
  if (text === undefined) return <div className={cx("fg-json-empty", className)}>{empty}</div>;
  return (
    <div className={cx("fg-json-box", className)}>
      <pre
        className="fg-json-pre"
        style={maxHeight === "none" ? undefined : { maxHeight }}
        // A block that scrolls must be reachable from the keyboard.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={label ?? "JSON"}
      >
        {highlightJson(text)}
      </pre>
      {children}
    </div>
  );
}

/** The button at the top right that copies the whole text. */
export function JsonViewCopy({ className }: { className?: string }) {
  const { copied, copy, blur } = useJson();
  return (
    <IconButton
      className={cx("fg-json-copy", className)}
      icon={copied ? Tick02Icon : Copy01Icon}
      label={copied ? "Copied" : "Copy JSON"}
      size="sm"
      variant="boxed"
      onClick={copy}
      onBlur={blur}
    />
  );
}
