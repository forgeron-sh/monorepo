import { Badge, Button } from "@forgeron/ui";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Impact, Status } from "./api";

// The small pieces the tools screens share. Presentational: no data, no workspace identity.

/** The tool's mark: its initials in a square, as the manifest carries no icon. */
export function ToolIcon({ name, size = 32 }: { name: string; size?: number }) {
  const letters = name
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return (
    <span
      className="ft-icon"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {letters || "?"}
    </span>
  );
}

const STATUS = {
  ready: { tone: "success", label: "Ready" },
  building: { tone: "warning", label: "Building" },
  failed: { tone: "danger", label: "Failed" },
} as const;

/** A state is a dot and a word, never a colour alone. */
export function StatusBadge({ status }: { status: Status }) {
  const { tone, label } = STATUS[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

export function BranchGlyph() {
  return (
    <svg
      className="ft-glyph"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="4.5" cy="3.5" r="1.5" />
      <circle cx="4.5" cy="12.5" r="1.5" />
      <circle cx="11.5" cy="5.5" r="1.5" />
      <path d="M4.5 5v6M11.5 7c0 2.5-2 3-7 3.5" />
    </svg>
  );
}

/** Copies a value. The label names what is copied, for a person using a screen reader. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          } catch {
            // Without clipboard access the text is still there to select.
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
      <span className="fg-sr" role="status">
        {copied ? `${label} copied` : ""}
      </span>
    </>
  );
}

/** A short commit hash in mono, with its message beside it. */
export function CommitLine({ commit }: { commit?: { sha: string; message?: string } }) {
  if (!commit) return <span className="fc-muted">No commit recorded</span>;
  return (
    <span className="ft-commit">
      <code title={commit.sha}>{commit.sha.slice(0, 7)}</code>
      {commit.message ? <span title={commit.message}>{commit.message}</span> : null}
    </span>
  );
}

const IMPACT: Record<Impact, string> = {
  major: "Major change",
  minor: "Minor change",
  patch: "Patch",
  none: "No change declared",
};

export function ImpactBadge({ impact }: { impact: Impact }) {
  const tone = impact === "major" ? "warning" : impact === "minor" ? "strong" : "neutral";
  return <Badge tone={tone}>{IMPACT[impact]}</Badge>;
}

/** A button that opens a short list of actions. Escape and a click outside close it. */
export function ActionMenu({
  label,
  items,
}: {
  label: string;
  items: ReadonlyArray<{ label: string; onSelect: () => void }>;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        box.current?.querySelector<HTMLElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (items.length === 0) return null;
  return (
    <div className="ft-menu" ref={box}>
      <Button
        size="sm"
        variant="ghost"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </Button>
      {open ? (
        <div className="ft-menu-list" role="menu" id={id}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="ft-menu-item"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A titled block of a screen. */
export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fc-section">
      <div className="fc-section-head">
        <h2 className="fc-section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}
