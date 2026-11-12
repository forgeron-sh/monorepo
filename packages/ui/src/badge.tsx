import type { ReactNode } from "react";
import { cx } from "./cx";

export interface BadgeProps {
  tone?: "neutral" | "strong" | "success" | "warning" | "danger";
  /** Dot before the text (states). */
  dot?: boolean;
  /** Mono font (identifiers: MCP, API, v1.4.0). */
  mono?: boolean;
  className?: string;
  children: ReactNode;
}

/** Short tag: interface, status, role. */
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
      {dot ? <span className="fg-dot" aria-hidden="true" /> : null}
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
      <span className="fg-env-mark" aria-hidden="true" />
      {children ?? ENV_LABEL[env]}
    </span>
  );
}
