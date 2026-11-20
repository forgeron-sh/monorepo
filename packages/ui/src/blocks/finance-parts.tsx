// Small parts the finance blocks share: an amount with its sign in text and its tone in colour, and
// the status of a document.

import { cx } from "../cx";
import { Badge } from "../badge";
import { defineStatuses, type StatusKey } from "../status-model";
import { formatMoney } from "../numbers";
import { signText, type Minor } from "./finance-model";

export interface AmountBadgeProps {
  /** Minor units; signed. */
  amount: Minor;
  currency: string;
  locale?: string;
  /**
   * `auto` (default): money in is `positive`, money out `negative`, zero `neutral`. The colour is
   * never alone: the sign is written (`+`, `−`) as well.
   */
  tone?: "auto" | "positive" | "negative" | "neutral";
  /** Swaps the colours of `auto`, for a ledger where money out is the normal thing (expenses). */
  invert?: boolean;
  /** Writes `+` before a positive amount. Default `true`; a minus is always written. */
  showPlus?: boolean;
  className?: string;
}

/** An amount of money: mono, right-aligned numerals, the sign in text and the tone in colour. */
export function AmountBadge({
  amount,
  currency,
  locale,
  tone = "auto",
  invert = false,
  showPlus = true,
  className,
}: AmountBadgeProps) {
  const resolved =
    tone !== "auto"
      ? tone
      : amount === 0
        ? "neutral"
        : amount > 0 !== invert
          ? "positive"
          : "negative";
  const sign = amount < 0 || showPlus ? signText(amount) : "";
  return (
    <span className={cx("fg-fin-amount", `fg-fin-amount-${resolved}`, className)}>
      {sign ? (
        <span className="fg-fin-sign" aria-hidden="true">
          {sign}
        </span>
      ) : null}
      <span>{formatMoney(Math.abs(amount), currency, locale)}</span>
      {sign ? <span className="fg-sr">{amount > 0 ? "credit" : "debit"}</span> : null}
    </span>
  );
}

const FINANCE_STATUS = defineStatuses({
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  sent: { label: "Sent", tone: "strong" },
  viewed: { label: "Viewed", tone: "strong" },
  accepted: { label: "Accepted", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  paid: { label: "Paid", tone: "success" },
  partial: { label: "Partial", tone: "warning" },
  overdue: { label: "Overdue", tone: "danger" },
  refused: { label: "Refused", tone: "danger" },
  rejected: { label: "Rejected", tone: "danger" },
  failed: { label: "Failed", tone: "danger" },
  void: { label: "Void", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
});

export type FinanceStatus = StatusKey<typeof FINANCE_STATUS>;

export interface StatusBadgeProps {
  /** A known status (`draft`, `sent`, `paid`, `overdue`…) or any word with its `tone`. */
  status: string;
  tone?: "neutral" | "strong" | "success" | "warning" | "danger";
  /** The text; the status as written, capitalised, by default. */
  label?: string;
  className?: string;
}

/** The state of an invoice, a quote, an expense or an order, in a word with a light. */
export function StatusBadge({ status, tone, label, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const known = FINANCE_STATUS.has(key) ? FINANCE_STATUS.tone(key) : undefined;
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge tone={tone ?? known ?? "neutral"} dot {...(className ? { className } : {})}>
      {text}
    </Badge>
  );
}
