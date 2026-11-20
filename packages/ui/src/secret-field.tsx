// A secret kept by the app (a signing key, a client secret, a password for a connection). It is
// hidden: the field shows a mask of fixed length, so its length leaks nothing, and the value is
// never in the page until someone asks for it. Reveal shows it for a few seconds and hides it
// again; copy puts it on the clipboard without showing it; replace asks for a new value and sends
// it; an unset secret says so and offers to set one. With children, `SecretField` is the root of
// its parts (`SecretFieldHeader`, `SecretFieldHint`, `SecretFieldBody`, `SecretFieldConfirm`);
// without, the props-driven field built from them (D-157).

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { formatAdminDate, relativeDay } from "./dates";
import { Badge } from "./badge";
import { Button } from "./button";
import { cx } from "./cx";
import { Input } from "./form";

/** What stands for a hidden secret, whatever its length: nothing about the value leaks. */
export const SECRET_MASK = "••••••••••••";

/** How long a revealed secret stays on screen, in milliseconds. */
export const SECRET_REVEAL_MS = 15_000;

/** Whole seconds left before `hideAt`, never below zero. */
export function secondsLeft(now: number, hideAt: number): number {
  return Math.max(Math.ceil((hideAt - now) / 1000), 0);
}

/** Whether a value can be saved as a secret: not empty, no line break, not only spaces. */
export function secretProblem(value: string): string | null {
  if (!value.trim()) return "Type the new value.";
  if (/[\r\n]/.test(value)) return "A secret is one line.";
  return null;
}

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
  /** The parts of a composed field. Without them, the field draws all of its parts. */
  children?: ReactNode;
  className?: string;
}

interface SecretState {
  id: string;
  label: string;
  isSet: boolean;
  hint: string | undefined;
  rotated: string | null;
  shown: string | null;
  now: number;
  hideAt: number;
  revealTimeout: number;
  mode: "view" | "replace" | "remove";
  setMode: (mode: "view" | "replace" | "remove") => void;
  draft: string;
  setDraft: (draft: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  busy: boolean;
  canRead: boolean;
  canReplace: boolean;
  canRemove: boolean;
  reveal: () => void;
  hide: (message?: string) => void;
  copy: () => void;
  save: () => void;
  cancel: () => void;
  remove: () => void;
}

const SecretContext = createContext<SecretState | null>(null);

function useSecret(): SecretState {
  const state = useContext(SecretContext);
  if (!state) throw new Error("SecretField parts go inside <SecretField>.");
  return state;
}

/**
 * A hidden value that is revealed on demand for a few seconds, copied, replaced or removed. With
 * children: the root of the parts; without: all of them, in the usual order.
 */
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
  children,
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

  const state: SecretState = {
    id,
    label,
    isSet,
    hint,
    rotated,
    shown,
    now,
    hideAt,
    revealTimeout,
    mode,
    setMode,
    draft,
    setDraft,
    error,
    setError,
    busy,
    canRead,
    canReplace: Boolean(onReplace),
    canRemove: Boolean(onRemove),
    reveal: () => void reveal(),
    hide,
    copy: () => void copy(),
    save: () => void save(),
    cancel,
    remove: () => {
      onRemove?.();
      setMode("view");
      hide("Secret removed.");
    },
  };

  return (
    <SecretContext.Provider value={state}>
      <div
        className={cx("fg-adm fg-adm-secret", className)}
        role="group"
        aria-labelledby={`${id}-label`}
      >
        {children ?? (
          <>
            <SecretFieldHeader />
            <SecretFieldHint />
            <SecretFieldBody />
            <SecretFieldConfirm />
          </>
        )}
        <span className="fg-sr" role="status" aria-live="polite">
          {said}
        </span>
      </div>
    </SecretContext.Provider>
  );
}

/** The label, whether a value is set, and when it was last changed. */
export function SecretFieldHeader({ className }: { className?: string }) {
  const { id, label, isSet, rotated } = useSecret();
  return (
    <div className={cx("fg-adm-secret-head", className)}>
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
  );
}

/** One line under the label: the `hint` of the field, or your own children. */
export function SecretFieldHint({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { hint } = useSecret();
  const words = children ?? hint;
  return words ? <p className={cx("fg-adm-secret-hint", className)}>{words}</p> : null;
}

/** The form that asks for a new value while replacing; the value or "Nothing stored yet" otherwise. */
export function SecretFieldBody({ className }: { className?: string }) {
  const s = useSecret();
  if (s.mode === "replace") return <SecretFieldForm className={className} />;
  if (s.isSet) {
    return (
      <div className={cx("fg-adm-secret-row", className)}>
        <SecretFieldValue />
        <SecretFieldActions />
      </div>
    );
  }
  return (
    <div className={cx("fg-adm-secret-row", className)}>
      <span className="fg-adm-secret-empty">Nothing stored yet.</span>
      {s.canReplace ? (
        <Button size="sm" variant="primary" onClick={() => s.setMode("replace")}>
          Set value
        </Button>
      ) : null}
    </div>
  );
}

/** The mask, or the secret while it is shown, with the seconds left before it hides. */
export function SecretFieldValue({ className }: { className?: string }) {
  const s = useSecret();
  return (
    <>
      <code
        className={cx("fg-adm-secret-value", s.shown === null && "fg-adm-secret-masked", className)}
        {...(s.shown === null ? { "aria-label": "Hidden" } : {})}
        tabIndex={s.shown === null ? undefined : 0}
      >
        {s.shown ?? SECRET_MASK}
      </code>
      {s.shown !== null && s.revealTimeout > 0 ? (
        <span className="fg-adm-secret-timer" aria-hidden="true">
          {secondsLeft(s.now, s.hideAt)} s
        </span>
      ) : null}
    </>
  );
}

/** Reveal or Hide, Copy, Replace and Remove, for what the field was given the means to do. */
export function SecretFieldActions({ className }: { className?: string }) {
  const s = useSecret();
  return (
    <span className={cx("fg-adm-secret-actions", className)}>
      {s.canRead ? (
        <Button
          size="sm"
          aria-pressed={s.shown !== null}
          aria-label={`${s.shown === null ? "Reveal" : "Hide"} ${s.label}`}
          onClick={() => (s.shown === null ? s.reveal() : s.hide())}
        >
          {s.shown === null ? "Reveal" : "Hide"}
        </Button>
      ) : null}
      {s.canRead ? (
        <Button size="sm" aria-label={`Copy ${s.label}`} onClick={s.copy}>
          Copy
        </Button>
      ) : null}
      {s.canReplace ? (
        <Button size="sm" aria-label={`Replace ${s.label}`} onClick={() => s.setMode("replace")}>
          Replace
        </Button>
      ) : null}
      {s.canRemove && s.mode === "view" ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove ${s.label}`}
          onClick={() => s.setMode("remove")}
        >
          Remove
        </Button>
      ) : null}
    </span>
  );
}

/** The password field and Save and Cancel that send a new value. */
export function SecretFieldForm({ className }: { className?: string }) {
  const s = useSecret();
  return (
    <form
      className={cx("fg-adm-secret-form", className)}
      onSubmit={(e) => {
        e.preventDefault();
        s.save();
      }}
    >
      <Input
        mono
        type="password"
        autoComplete="new-password"
        spellCheck={false}
        aria-label={`New value of ${s.label}`}
        aria-invalid={s.error ? true : undefined}
        aria-describedby={s.error ? `${s.id}-error` : undefined}
        value={s.draft}
        autoFocus
        onChange={(e) => {
          s.setDraft(e.currentTarget.value);
          s.setError(null);
        }}
      />
      <Button type="submit" variant="primary" size="sm" disabled={s.busy}>
        {s.busy ? "Saving…" : "Save"}
      </Button>
      <Button size="sm" onClick={s.cancel}>
        Cancel
      </Button>
      {s.error ? (
        <p id={`${s.id}-error`} className="fg-adm-secret-error" role="alert">
          {s.error}
        </p>
      ) : null}
    </form>
  );
}

/** The second click that removes the secret; shown after Remove. */
export function SecretFieldConfirm({ className }: { className?: string }) {
  const s = useSecret();
  if (s.mode !== "remove") return null;
  return (
    <div
      className={cx("fg-adm-secret-confirm", className)}
      role="group"
      aria-label={`Remove ${s.label}?`}
    >
      <span>Remove this secret? Whatever uses it stops working.</span>
      <Button size="sm" variant="danger" autoFocus onClick={s.remove}>
        Remove
      </Button>
      <Button size="sm" onClick={() => s.setMode("view")}>
        Keep
      </Button>
    </div>
  );
}
