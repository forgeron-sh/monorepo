import type { ReactNode } from "react";
import { cx } from "./cx";
import { Led } from "./led";

export interface BadgeProps {
  tone?: "neutral" | "strong" | "success" | "warning" | "danger";
  /** A square LED before the text, in the tone's color (states). */
  dot?: boolean;
  /** An identifier (v1.4.0, crm.contacts.list): its case is kept, where a badge is set in capitals. */
  mono?: boolean;
  className?: string;
  children: ReactNode;
}

/** Short mono label in capitals: interface, status, role. */
export function Badge({ tone = "neutral", dot, mono, className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        "fg-badge",
        tone !== "neutral" && `fg-badge-${tone}`,
        mono && "fg-badge-mono",
        className,
      )}
    >
      {dot ? <Led tone="current" /> : null}
      {children}
    </span>
  );
}

/**
 * Production, another permanent channel (`channel`, its name given as children), or a branch's
 * temporary channel (`preview`), D-125.
 */
const ENV_LABEL = { production: "Production", channel: "Channel", preview: "Branch" } as const;

export interface EnvTagProps {
  env: keyof typeof ENV_LABEL;
  className?: string;
  children?: ReactNode;
}

/** The channel of a version: shape carries the information, not the tint. */
export function EnvTag({ env, className, children }: EnvTagProps) {
  return (
    <span className={cx("fg-env", `fg-env-${env}`, className)}>
      <Led tone="current" className="fg-env-mark" />
      {children ?? ENV_LABEL[env]}
    </span>
  );
}
