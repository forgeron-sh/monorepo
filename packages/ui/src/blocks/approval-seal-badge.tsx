// The proof that something was signed or approved: who, when (with the time zone), how, and the
// first characters of the hash of what they acted on. A small stamp for the margin of a document,
// a row of an audit or the end of an email.

import { SealIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { formatStamp, hashPrefix } from "./approval-model";

export interface SealBadgeProps {
  /** What was done: "Signed", "Approved", "Validated". */
  action?: string;
  /** Who did it. */
  who: string;
  /** The role or the email under the name. */
  detail?: string;
  /** When: an ISO timestamp (`2026-11-19T14:32:10Z`). */
  at: string;
  /** How: "Drawn signature", "Email code", "Single sign-on". */
  method?: string;
  /** The hash of what was signed; only the first characters are shown. */
  hash?: string;
  /** How many characters of the hash to show; 8 by default. */
  hashLength?: number;
  /** `valid` (default), `revoked`, `unverified`. The state is always written. */
  state?: "valid" | "revoked" | "unverified";
  /** A single line, for a margin or a table cell. */
  compact?: boolean;
  /** At the end of the seal: a link to the full proof. */
  children?: ReactNode;
  className?: string;
}

const STATES = {
  valid: "Verified",
  revoked: "Revoked",
  unverified: "Not verified",
} as const;

/** Proof of a signature or an approval: who, when, the hash prefix and the method. */
export function SealBadge({
  action = "Approved",
  who,
  detail,
  at,
  method,
  hash,
  hashLength = 8,
  state = "valid",
  compact = false,
  children,
  className,
}: SealBadgeProps) {
  const stamp = formatStamp(at);
  const prefix = hash ? hashPrefix(hash, hashLength) : "";
  if (compact) {
    return (
      <span
        className={cx("fg-seal fg-seal-compact", `fg-seal-${state}`, className)}
        role="group"
        aria-label={`${action} by ${who}, ${stamp}, ${STATES[state]}`}
      >
        <Icon icon={SealIcon} size={12} variant="mono" />
        <span>
          {action} by <b>{who}</b>
        </span>
        <time dateTime={at}>{stamp}</time>
        {prefix ? <code>{prefix}</code> : null}
      </span>
    );
  }
  return (
    <figure
      className={cx("fg-seal", `fg-seal-${state}`, className)}
      aria-label={`${action} by ${who}, ${stamp}, ${STATES[state]}`}
    >
      <span className="fg-seal-mark" aria-hidden="true">
        <Icon icon={SealIcon} size={24} variant="mono" />
      </span>
      <div className="fg-seal-body">
        <p className="fg-seal-top">
          <span className="fg-seal-action">{action}</span>
          <span className="fg-seal-state">{STATES[state]}</span>
        </p>
        <p className="fg-seal-who">
          <b>{who}</b>
          {detail ? <span className="fg-seal-detail"> · {detail}</span> : null}
        </p>
        <dl className="fg-seal-facts">
          <div>
            <dt>When</dt>
            <dd>
              <time dateTime={at}>{stamp}</time>
            </dd>
          </div>
          {method ? (
            <div>
              <dt>Method</dt>
              <dd>{method}</dd>
            </div>
          ) : null}
          {prefix ? (
            <div>
              <dt>Hash</dt>
              <dd>
                <code title="The first characters of the hash of the signed content">{prefix}</code>
              </dd>
            </div>
          ) : null}
        </dl>
        {children}
      </div>
    </figure>
  );
}
