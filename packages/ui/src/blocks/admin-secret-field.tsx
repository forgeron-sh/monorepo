// A secret kept by the app (a signing key, a client secret, a password for a connection). It is
// hidden: the field shows a mask of fixed length, so its length leaks nothing, and the value is
// never in the page until someone asks for it. Reveal shows it for a few seconds and hides it
// again; copy puts it on the clipboard without showing it; replace asks for a new value and sends
// it; an unset secret says so and offers to set one.

import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { cx } from "../cx";
import { Input } from "../form";
import {
  formatAdminDate,
  relativeDay,
  SECRET_MASK,
  SECRET_REVEAL_MS,
  secondsLeft,
  secretProblem,
} from "./admin-model";

export interface SecretFieldProps {
  /** Names the secret: "Signing secret". */
  label: string;
  /** Whether a value is stored. Unset shows "Not set" and a button to set one. */
  isSet: boolean;
  /**
   * Reads the value when someone reveals or copies it, so the page does not hold it before.
   * It may come from the network.
   */
  getValue?: () => string | Promise<string>;
  /** The value, when the app has it in memory already. `getValue` wins when both are given. */
  value?: string;
  /** When it was last changed: `YYYY-MM-DD`, with or without a time. */
  rotatedAt?: string;
  /** Today, `YYYY-MM-DD`: the rotation is told as "3 days ago". Without it, as a date. */
  today?: string;
  /** How long a revealed value stays, in milliseconds; 0 keeps it until hidden. Default 15000. */
  revealTimeout?: number;
  /** Sends the new value. The field never keeps it. Without it there is no Replace button. */
  onReplace?: (value: string) => void | Promise<void>;
  /** Removes the secret, after a second click to confirm. */
  onRemove?: () => void;
  /** Hears that the secret was copied (log it). */
  onCopy?: () => void;
  /** One line under the label. */
  hint?: string;
  className?: string;
}

/** A hidden value that is revealed on demand for a few seconds, copied, replaced or removed. */
export function SecretField({
  label,
  isSet,
  getValue,
  value,
  rotatedAt,
  today,
  revealTimeout = SECRET_REVEAL_MS,
  onReplace,
  onRemove,
  onCopy,
  hint,
  className,
}: SecretFieldProps) {
  const id = useId();
  const [shown, setShown] = useState<string | null>(null);
  const [hideAt, setHideAt] = useState(0);
  const [now, setNow] = useState(0);
  const [mode, setMode] = useState<"view" | "replace" | "remove">("view");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const canRead = Boolean(getValue) || value !== undefined;

  const hide = (message = "Secret hidden.") => {
    clearInterval(timer.current);
    setShown(null);
    setSaid(message);
  };

  // A revealed value goes away on its own, and when the tab is left.
  useEffect(() => {
    if (shown === null) return undefined;
    const onVisibility = () => document.hidden && hide();
    document.addEventListener("visibilitychange", onVisibility);
    if (revealTimeout > 0) {
      timer.current = setInterval(() => {
        const t = Date.now();
        setNow(t);
        if (t >= hideAt) hide("Secret hidden.");
      }, 250);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown === null, hideAt, revealTimeout]);
  useEffect(
    () => () => {
      clearInterval(timer.current);
      clearTimeout(copiedTimer.current);
    },
    [],
  );

  const read = async (): Promise<string | undefined> => (getValue ? await getValue() : value);

  const reveal = async () => {
    const secret = await read();
    if (secret === undefined) return;
    const t = Date.now();
    setNow(t);
    setHideAt(t + revealTimeout);
    setShown(secret);
    setSaid(
      revealTimeout > 0
        ? `Secret shown. It hides in ${Math.round(revealTimeout / 1000)} seconds.`
        : "Secret shown.",
    );
  };

  const copy = async () => {
    const secret = await read();
    if (secret === undefined) return;
    try {
      await navigator.clipboard?.writeText(secret);
    } catch {
      setSaid("Copy failed. Reveal the secret and copy it by hand.");
      return;
    }
    onCopy?.();
    setSaid("Copied to the clipboard.");
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setSaid(""), 2000);
  };

  const save = async () => {
    const problem = secretProblem(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      await onReplace?.(draft);
      setDraft("");
      setMode("view");
      setError(null);
      hide(isSet ? "Secret replaced." : "Secret saved.");
    } catch {
      setError("The new value was not saved. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setDraft("");
    setError(null);
    setMode("view");
  };

  const rotated = rotatedAt
    ? today
      ? relativeDay(rotatedAt, today)
      : formatAdminDate(rotatedAt)
    : null;

  return (
    <div
      className={cx("fg-adm fg-adm-secret", className)}
      role="group"
      aria-labelledby={`${id}-label`}
    >
      <div className="fg-adm-secret-head">
        <span id={`${id}-label`} className="fg-adm-secret-label">
          {label}
        </span>
        {isSet ? (
          <Badge tone="success" dot>
            Set
          </Badge>
        ) : (
          <Badge>Not set</Badge>
        )}
        {isSet && rotated ? <span className="fg-adm-secret-rot">Changed {rotated}</span> : null}
      </div>
      {hint ? <p className="fg-adm-secret-hint">{hint}</p> : null}

      {mode === "replace" ? (
        <form
          className="fg-adm-secret-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Input
            mono
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            aria-label={`New value of ${label}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            value={draft}
            autoFocus
            onChange={(e) => {
              setDraft(e.currentTarget.value);
              setError(null);
            }}
          />
          <Button type="submit" variant="primary" size="sm" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" onClick={cancel}>
            Cancel
          </Button>
          {error ? (
            <p id={`${id}-error`} className="fg-adm-secret-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : isSet ? (
        <div className="fg-adm-secret-row">
          <code
            className={cx("fg-adm-secret-value", shown === null && "fg-adm-secret-masked")}
            {...(shown === null ? { "aria-label": "Hidden" } : {})}
            tabIndex={shown === null ? undefined : 0}
          >
            {shown ?? SECRET_MASK}
          </code>
          {shown !== null && revealTimeout > 0 ? (
            <span className="fg-adm-secret-timer" aria-hidden="true">
              {secondsLeft(now, hideAt)} s
            </span>
          ) : null}
          <span className="fg-adm-secret-actions">
            {canRead ? (
              <Button
                size="sm"
                aria-pressed={shown !== null}
                aria-label={`${shown === null ? "Reveal" : "Hide"} ${label}`}
                onClick={() => (shown === null ? void reveal() : hide())}
              >
                {shown === null ? "Reveal" : "Hide"}
              </Button>
            ) : null}
            {canRead ? (
              <Button size="sm" aria-label={`Copy ${label}`} onClick={() => void copy()}>
                Copy
              </Button>
            ) : null}
            {onReplace ? (
              <Button size="sm" aria-label={`Replace ${label}`} onClick={() => setMode("replace")}>
                Replace
              </Button>
            ) : null}
            {onRemove && mode === "view" ? (
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Remove ${label}`}
                onClick={() => setMode("remove")}
              >
                Remove
              </Button>
            ) : null}
          </span>
        </div>
      ) : (
        <div className="fg-adm-secret-row">
          <span className="fg-adm-secret-empty">Nothing stored yet.</span>
          {onReplace ? (
            <Button size="sm" variant="primary" onClick={() => setMode("replace")}>
              Set value
            </Button>
          ) : null}
        </div>
      )}

      {mode === "remove" ? (
        <div className="fg-adm-secret-confirm" role="group" aria-label={`Remove ${label}?`}>
          <span>Remove this secret? Whatever uses it stops working.</span>
          <Button
            size="sm"
            variant="danger"
            autoFocus
            onClick={() => {
              onRemove?.();
              setMode("view");
              hide("Secret removed.");
            }}
          >
            Remove
          </Button>
          <Button size="sm" onClick={() => setMode("view")}>
            Keep
          </Button>
        </div>
      ) : null}
      <span className="fg-sr" role="status" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
