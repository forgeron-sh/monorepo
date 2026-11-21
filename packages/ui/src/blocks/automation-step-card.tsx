// One step of an automation, after the nodes of the Flows prototype: its pixel icon in a tile,
// its name, what it calls in mono, and, after a run, its state in words with the time it took or
// the error. The same card is a row of a step list and the body of a node on a canvas.
//
// Two ways to use it. With `title` and `icon` it is the card above. Without a `title` it is the
// root of the parts, which build any card:
//
//   <StepCard kind="action" status="error" onSelect={open}>
//     <StepCardMain icon={Mail01Icon}>
//       <StepCardText><StepCardTitle>Send invoice</StepCardTitle></StepCardText>
//     </StepCardMain>
//     <StepCardState />
//     <StepCardError>503 from the relay</StepCardError>
//   </StepCard>

import type { IconDefinition } from "@forgeron/icons";
import { BoltIcon } from "@forgeron/icons";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { renderPart } from "../part";
import { Status, StatusIndicator, StatusLabel } from "../status";
import {
  statusLook,
  type AutomationStep,
  type StepKind,
  type StepStatus,
} from "./automation-model";

/** What the parts of one card share. */
interface StepCardContext {
  kind: StepKind;
  status: StepStatus;
  disabled: boolean;
  selected: boolean | undefined;
  onSelect: (() => void) | undefined;
  /** The card itself is a tab stop of a list: its button is not. */
  roving: boolean;
}

const Ctx = createContext<StepCardContext | null>(null);

/** The card a part is in: its kind, status and what happens on a click. */
export function useStepCard(part = "useStepCard"): StepCardContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StepCard>.`);
  return ctx;
}

/* ---------------------------------------------------------------- root */

type CardElement = Omit<ComponentProps<"div">, "title" | "className" | "children">;

interface StepCardShared extends CardElement {
  /** `row` (default): full width, in a list. `node`: a fixed 240px card, the body of a canvas node. */
  layout?: "row" | "node";
  kind?: StepKind;
  status?: StepStatus;
  disabled?: boolean;
  /** Outlined in ember: the step open in the inspector. */
  selected?: boolean;
  /** Makes the card a button: opens the step. */
  onSelect?: () => void;
  className?: string;
  /** shadcn's `asChild`: the one child element becomes the card. */
  asChild?: boolean;
}

export interface StepCardProps
  extends StepCardShared, Omit<AutomationStep, "id" | "branches" | "kind" | "status" | "disabled"> {
  /** Small buttons on the right, shown on hover and focus: move, delete. */
  actions?: ReactNode;
}

/** The parts form: `title` stays undefined. */
export interface StepCardRootProps extends StepCardShared {
  title?: undefined;
  children?: ReactNode;
}

/**
 * A step: icon, name, call, and the state of its last run. With `title` it builds itself from its
 * props; without, it is the root of `StepCardMain`, `StepCardState`, `StepCardActions`… Whatever
 * else you pass (`id`, `tabIndex`, collection item props…) goes on the card.
 */
export function StepCard(props: StepCardProps | StepCardRootProps) {
  if (props.title === undefined) return <StepCardRoot {...(props as StepCardRootProps)} />;
  const {
    title,
    subtitle,
    icon,
    meta,
    error,
    actions,
    kind = "action",
    status = "idle",
    disabled,
    ...root
  } = props as StepCardProps;
  const shown = status !== "idle";
  return (
    <StepCardRoot kind={kind} status={status} disabled={disabled} {...root}>
      <StepCardTrigger />
      <StepCardMain icon={icon}>
        <StepCardText>
          <StepCardTitle>{title}</StepCardTitle>
          {subtitle ? <StepCardSubtitle>{subtitle}</StepCardSubtitle> : null}
        </StepCardText>
      </StepCardMain>
      <StepCardState />
      {actions ? <StepCardActions>{actions}</StepCardActions> : null}
      {error && status === "error" ? (
        <StepCardError>{error}</StepCardError>
      ) : meta && shown ? (
        <StepCardMeta>{meta}</StepCardMeta>
      ) : null}
    </StepCardRoot>
  );
}

function StepCardRoot({
  title: _title,
  kind = "action",
  status = "idle",
  disabled = false,
  layout = "row",
  selected,
  onSelect,
  className,
  asChild,
  children,
  ...rest
}: StepCardRootProps) {
  const shown = status !== "idle";
  const ctx: StepCardContext = {
    kind,
    status,
    disabled,
    selected,
    onSelect,
    roving: rest.tabIndex !== undefined,
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart(
        "div",
        cx(
          "fg-step",
          `fg-step-${kind}`,
          layout === "node" && "fg-step-node",
          shown && `fg-step-is-${status}`,
          selected && "fg-step-selected",
          disabled && "fg-step-disabled",
          className,
        ),
        asChild,
        { "data-slot": "step-card", ...rest, children },
      )}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

export interface StepCardTriggerProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string;
  asChild?: boolean;
}

/** The bolt in front of a trigger. Renders nothing in a card that is not one. */
export function StepCardTrigger({ className, asChild, children, ...rest }: StepCardTriggerProps) {
  const { kind } = useStepCard("StepCardTrigger");
  if (kind !== "trigger") return null;
  return renderPart("span", cx("fg-step-trig", className), asChild, {
    "data-slot": "step-card-trigger",
    title: "Trigger",
    ...rest,
    children: children ?? (
      <>
        <Icon icon={BoltIcon} size={12} variant="mono" />
        <span className="fg-sr">Trigger: </span>
      </>
    ),
  });
}

export interface StepCardMainProps extends Omit<ComponentProps<"div">, "className"> {
  /** The icon of its tile; without, no tile. */
  icon?: IconDefinition;
  className?: string;
  asChild?: boolean;
}

/**
 * The body of the card, its tile and its text. A button when the card has `onSelect` (it is the
 * only tab stop of a plain card, and none when the card itself is one of a list).
 */
export function StepCardMain({ icon, className, asChild, children, ...rest }: StepCardMainProps) {
  const { kind, selected, onSelect, roving } = useStepCard("StepCardMain");
  const body = (
    <>
      {icon ? (
        <span className="fg-step-tile" data-slot="step-card-tile">
          <Icon icon={icon} size={12} variant={kind === "trigger" ? "mono" : "duo"} />
        </span>
      ) : null}
      {children}
    </>
  );
  if (onSelect && !asChild) {
    return (
      <button
        type="button"
        data-slot="step-card-main"
        {...(rest as ComponentProps<"button">)}
        className={cx("fg-step-main", className)}
        aria-pressed={selected ?? false}
        tabIndex={roving ? -1 : undefined}
        onClick={(event) => {
          (rest as ComponentProps<"button">).onClick?.(event);
          onSelect();
        }}
      >
        {body}
      </button>
    );
  }
  return renderPart("div", cx("fg-step-main", className), asChild, {
    "data-slot": "step-card-main",
    ...rest,
    children: asChild ? children : body,
  });
}

/** The name and what it calls, one above the other. */
export function StepCardText({
  className,
  asChild,
  ...rest
}: Omit<ComponentProps<"span">, "className"> & { className?: string; asChild?: boolean }) {
  return renderPart("span", cx("fg-step-text", className), asChild, {
    "data-slot": "step-card-text",
    ...rest,
  });
}

/** The name of the step. */
export function StepCardTitle({
  className,
  asChild,
  ...rest
}: Omit<ComponentProps<"span">, "className"> & { className?: string; asChild?: boolean }) {
  return renderPart("span", cx("fg-step-title", className), asChild, {
    "data-slot": "step-card-title",
    ...rest,
  });
}

/** What the step calls, in mono: `Chat · postMessage()`. */
export function StepCardSubtitle({
  className,
  asChild,
  ...rest
}: Omit<ComponentProps<"span">, "className"> & { className?: string; asChild?: boolean }) {
  return renderPart("span", cx("fg-step-sub", className), asChild, {
    "data-slot": "step-card-subtitle",
    ...rest,
  });
}

export interface StepCardStateProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string;
}

/** The state of the last run in a word, or `Disabled`. Nothing while the step is idle. */
export function StepCardState({ className, children, ...rest }: StepCardStateProps) {
  const { status, disabled } = useStepCard("StepCardState");
  if (status === "idle" && !disabled) return null;
  const look = statusLook(status);
  return (
    <Status
      tone={disabled ? "neutral" : look.tone}
      data-slot="step-card-state"
      {...rest}
      className={cx("fg-step-state", className)}
    >
      {children ?? (
        <>
          <StatusIndicator />
          <StatusLabel>{disabled ? "Disabled" : look.word}</StatusLabel>
        </>
      )}
    </Status>
  );
}

/** Small buttons on the right, shown on hover and focus. */
export function StepCardActions({
  className,
  asChild,
  ...rest
}: Omit<ComponentProps<"span">, "className"> & { className?: string; asChild?: boolean }) {
  return renderPart("span", cx("fg-step-actions", className), asChild, {
    "data-slot": "step-card-actions",
    ...rest,
  });
}

/** After a run: `120 ms · 3 items`. */
export function StepCardMeta({
  className,
  asChild,
  ...rest
}: Omit<ComponentProps<"span">, "className"> & { className?: string; asChild?: boolean }) {
  return renderPart("span", cx("fg-step-meta", className), asChild, {
    "data-slot": "step-card-meta",
    ...rest,
  });
}

/** The error of a failed run, in one line. */
export function StepCardError({
  className,
  asChild,
  ...rest
}: Omit<ComponentProps<"span">, "className"> & { className?: string; asChild?: boolean }) {
  return renderPart("span", cx("fg-step-meta fg-step-error", className), asChild, {
    "data-slot": "step-card-error",
    ...rest,
  });
}
