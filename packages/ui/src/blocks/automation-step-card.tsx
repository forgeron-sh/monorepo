// One step of an automation, after the nodes of the Flows prototype: its pixel icon in a tile,
// its name, what it calls in mono, and, after a run, its state in words with the time it took or
// the error. The same card is a row of a step list and the body of a node on a canvas.

import { BoltIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Led } from "../led";
import { statusLook, type AutomationStep } from "./automation-model";

export interface StepCardProps extends Omit<AutomationStep, "id" | "branches"> {
  /** `row` (default): full width, in a list. `node`: a fixed 240px card, the body of a canvas node. */
  layout?: "row" | "node";
  /** Outlined in ember: the step open in the inspector. */
  selected?: boolean;
  /** Makes the card a button: opens the step. */
  onSelect?: () => void;
  /** Small buttons on the right, shown on hover and focus: move, delete. */
  actions?: ReactNode;
  className?: string;
}

/** A step: icon, name, call, and the state of its last run. */
export function StepCard({
  title,
  subtitle,
  icon,
  kind = "action",
  status = "idle",
  meta,
  error,
  disabled,
  layout = "row",
  selected,
  onSelect,
  actions,
  className,
}: StepCardProps) {
  const look = statusLook(status);
  const shown = status !== "idle";
  const body = (
    <>
      <span className="fg-step-tile">
        <Icon icon={icon} size={12} variant={kind === "trigger" ? "mono" : "duo"} />
      </span>
      <span className="fg-step-text">
        <span className="fg-step-title">{title}</span>
        {subtitle ? <span className="fg-step-sub">{subtitle}</span> : null}
      </span>
    </>
  );
  return (
    <div
      className={cx(
        "fg-step",
        `fg-step-${kind}`,
        layout === "node" && "fg-step-node",
        shown && `fg-step-is-${status}`,
        selected && "fg-step-selected",
        disabled && "fg-step-disabled",
        className,
      )}
    >
      {kind === "trigger" ? (
        <span className="fg-step-trig" title="Trigger">
          <Icon icon={BoltIcon} size={12} variant="mono" />
          <span className="fg-sr">Trigger: </span>
        </span>
      ) : null}
      {onSelect ? (
        <button
          type="button"
          className="fg-step-main"
          aria-pressed={selected ?? false}
          onClick={onSelect}
        >
          {body}
        </button>
      ) : (
        <div className="fg-step-main">{body}</div>
      )}
      {shown || disabled ? (
        <span className="fg-step-state">
          <Led tone={disabled ? "neutral" : look.tone} />
          {disabled ? "Disabled" : look.word}
        </span>
      ) : null}
      {actions ? <span className="fg-step-actions">{actions}</span> : null}
      {error && status === "error" ? (
        <span className="fg-step-meta fg-step-error">{error}</span>
      ) : meta && shown ? (
        <span className="fg-step-meta">{meta}</span>
      ) : null}
    </div>
  );
}
