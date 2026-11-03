import { useEffect, useState } from "react";
import { cx } from "./cx";

export interface CopyBlockProps {
  /** What gets copied: a command, a URL. Shown in mono. */
  value: string;
  /** Names the block for assistive technology, e.g. "Sign in from your terminal". */
  label: string;
  /** Where it goes: a `$` before a command, say. Not copied. */
  prefix?: string;
  className?: string;
}

/** A `surface-sunken` block with the text to copy and a button that copies it. */
export function CopyBlock({ value, label, prefix, className }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Without clipboard access the text is still there to select.
    }
  };

  return (
    <div className={cx("fg-copy", className)}>
      <div className="fg-copy-head">
        <span>{label}</span>
        <button type="button" className="fg-copy-btn" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="fg-copy-pre">
        <code className="fg-copy-text" tabIndex={0} aria-label={label}>
          {prefix ? (
            <span className="fg-copy-prefix" aria-hidden="true">
              {prefix}{" "}
            </span>
          ) : null}
          {value}
        </code>
      </pre>
      <span className="fg-sr" role="status">
        {copied ? "Copied to the clipboard" : ""}
      </span>
    </div>
  );
}
