// A state in a word: a tone indicator and its label (D-157). `Status` with `label` is the
// props-driven one, without it the root of the parts (`StatusIndicator`, `StatusLabel`).

import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  isValidElement,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cx } from "./cx";
import { Led, type LedProps } from "./led";
import type { StatusTone } from "./status-model";

const ToneContext = createContext<StatusTone>("neutral");

/** `strong` has no dot of its own: it is drawn in the text colour. */
const ledTone = (tone: StatusTone): NonNullable<LedProps["tone"]> =>
  tone === "strong" ? "current" : tone;

export interface StatusRootProps extends Omit<ComponentProps<"span">, "children"> {
  tone?: StatusTone;
  /** shadcn's `asChild`: the one child element becomes the root. */
  asChild?: boolean;
  /** Stays undefined: with a `label`, `Status` is the props-driven one. */
  label?: undefined;
  className?: string;
  children?: ReactNode;
}

export interface StatusProps extends Omit<StatusRootProps, "label"> {
  /** The state in a word. */
  label: ReactNode;
  /** A mark in place of the tone dot. */
  glyph?: ReactNode;
}

/**
 * With `label`: the tone dot and the word. Without: the root of the parts, which gives its `tone`
 * to `StatusIndicator`.
 */
export function Status(props: StatusProps | StatusRootProps) {
  if (props.label !== undefined) {
    const { label, glyph, children: _children, ...rest } = props as StatusProps;
    return (
      <StatusRoot {...rest}>
        <StatusIndicator>{glyph}</StatusIndicator>
        <StatusLabel>{label}</StatusLabel>
      </StatusRoot>
    );
  }
  return <StatusRoot {...(props as StatusRootProps)} />;
}

function StatusRoot({
  tone = "neutral",
  asChild,
  label: _label,
  className,
  children,
  ...rest
}: StatusRootProps) {
  const child = asChild && isValidElement(children);
  const element = useRender({
    defaultTagName: "span",
    render: child ? children : undefined,
    props: {
      ...rest,
      "data-tone": tone,
      className: cx("fg-status", className),
      ...(child ? {} : { children }),
    },
  });
  return <ToneContext.Provider value={tone}>{element}</ToneContext.Provider>;
}

export interface StatusIndicatorProps extends Omit<ComponentProps<"span">, "children"> {
  className?: string;
  /** Replaces the dot with any glyph; decorative like the dot, the word is the label. */
  children?: ReactNode;
}

/** The mark of the state: the `Led` of the root's tone, or `children`. Decorative. */
export function StatusIndicator({ className, children, ...rest }: StatusIndicatorProps) {
  const tone = useContext(ToneContext);
  if (children === undefined || children === null || children === false) {
    return <Led tone={ledTone(tone)} className={className} />;
  }
  return (
    <span {...rest} aria-hidden="true" className={cx("fg-status-indicator", className)}>
      {children}
    </span>
  );
}

/** The state in a word: what assistive technology reads. */
export function StatusLabel({ className, ...rest }: ComponentProps<"span">) {
  return <span {...rest} className={cx("fg-status-label", className)} />;
}

/** What `StatusOf` reads from a set made by `defineStatuses`. */
export interface StatusLookup<K extends string> {
  readonly keys: ReadonlyArray<K>;
  get(key: K): { label: string; tone: StatusTone; glyph?: unknown };
}

export interface StatusOfProps<K extends string> extends Omit<
  StatusRootProps,
  "tone" | "label" | "children"
> {
  set: StatusLookup<K>;
  value: K;
  /** Show the set's glyph (when it has one) in place of the dot. Default: yes. */
  glyph?: boolean;
}

/** A state of a set: its indicator and its word, from `defineStatuses`. */
export function StatusOf<K extends string>({
  set,
  value,
  glyph = true,
  ...rest
}: StatusOfProps<K>) {
  const item = set.get(value);
  return (
    <Status
      {...rest}
      tone={item.tone}
      label={item.label}
      glyph={glyph ? (item.glyph as ReactNode) : undefined}
    />
  );
}
