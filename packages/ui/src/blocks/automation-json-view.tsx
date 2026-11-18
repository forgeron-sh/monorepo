// The input or output of a step, after the run panels of the Flows prototype: JSON in mono, keys
// in ink, strings in green, numbers and booleans in amber, `null` dim. Selectable, scrolls past
// its height, copied whole with the button.

import { Copy01Icon, Tick02Icon } from "@forgeron/icons";
import { useState, type ReactNode } from "react";
import { cx } from "../cx";
import { IconButton } from "../identity";

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

/** JSON, coloured by kind, in a block that scrolls. */
export function JsonView({
  value,
  label,
  maxHeight = 320,
  copyable = true,
  empty = "No data",
  className,
}: JsonViewProps) {
  const [copied, setCopied] = useState(false);
  const text = value === undefined ? undefined : JSON.stringify(value, null, 2);
  const copy = () => {
    if (text === undefined) return;
    void navigator.clipboard?.writeText(text).then(() => setCopied(true));
  };
  return (
    <figure className={cx("fg-json", className)}>
      {label ? <figcaption className="fg-json-label">{label}</figcaption> : null}
      {text === undefined ? (
        <div className="fg-json-empty">{empty}</div>
      ) : (
        <div className="fg-json-box">
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
          {copyable ? (
            <IconButton
              className="fg-json-copy"
              icon={copied ? Tick02Icon : Copy01Icon}
              label={copied ? "Copied" : "Copy JSON"}
              size="sm"
              variant="boxed"
              onClick={copy}
              onBlur={() => setCopied(false)}
            />
          ) : null}
        </div>
      )}
    </figure>
  );
}
