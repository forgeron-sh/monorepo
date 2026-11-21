// Two panes with a divider between them that can be dragged or moved with the arrow keys.
// `SplitPane` takes the props form (`first`, `second`) or, as in shadcn, its parts:
// `SplitPanePanel` twice (the second `secondary`) around a `SplitPaneHandle` (D-156).
// It is a preset of `Resizable` (src/resizable.tsx) in its px mode: one implementation.

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Children, cloneElement, isValidElement } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  registerResizablePart,
  type ResizablePanelProps,
} from "./resizable";
import { type Part } from "./part";

export interface SplitPaneProps {
  /** Names the divider for assistive technology: "Resize the sidebar". */
  label: string;
  first: ReactNode;
  second: ReactNode;
  /** `horizontal` (default): side by side, a vertical divider. `vertical`: one above the other. */
  direction?: "horizontal" | "vertical";
  /** The size of the first pane in px; the second takes the rest. */
  size?: number;
  defaultSize?: number;
  onChange?: (size: number) => void;
  /** Fires when a drag ends or a key is pressed: the moment to save the size. */
  onChangeEnd?: (size: number) => void;
  /** The least the first pane can shrink to, in px. Default 160. */
  min?: number;
  /** The most the first pane can grow to, in px; by default what leaves `minSecond` to the other. */
  max?: number;
  /** The least the second pane can shrink to, in px. Default 160. */
  minSecond?: number;
  /** What an arrow key moves the divider by, in px; with Shift, four times as much. Default 16. */
  keyStep?: number;
  className?: string;
}

/** The parts form: no `first`; the children are two `SplitPanePanel` and a `SplitPaneHandle`. */
export interface SplitPaneRootProps extends Omit<
  Part<ComponentProps<"div">>,
  "onChange" | "defaultValue"
> {
  first?: undefined;
  second?: undefined;
  label?: undefined;
  direction?: "horizontal" | "vertical";
  size?: number;
  defaultSize?: number;
  onChange?: (size: number) => void;
  onChangeEnd?: (size: number) => void;
  min?: number;
  max?: number;
  minSecond?: number;
  keyStep?: number;
}

/**
 * Two panes and a divider. Drag it, or focus it and press the arrows (Shift for bigger jumps),
 * Home and End for the limits; a double click goes back to the first size. The size is yours
 * (`size` and `onChange`) or the component's (`defaultSize`). With `first` and `second`: the whole
 * thing; without: the root of `SplitPanePanel` and `SplitPaneHandle`.
 */
export function SplitPane(props: SplitPaneProps | SplitPaneRootProps) {
  if (props.first === undefined) return <SplitPaneRoot {...(props as SplitPaneRootProps)} />;
  const { label, first, second, ...rest } = props as SplitPaneProps;
  return (
    <SplitPaneRoot {...rest}>
      <SplitPanePanel>{first}</SplitPanePanel>
      <SplitPaneHandle label={label} />
      <SplitPanePanel secondary>{second}</SplitPanePanel>
    </SplitPaneRoot>
  );
}

function SplitPaneRoot({
  direction = "horizontal",
  size,
  defaultSize = 320,
  onChange,
  onChangeEnd,
  min = 160,
  max,
  minSecond = 160,
  keyStep = 16,
  className,
  style,
  children,
  first: _first,
  second: _second,
  label: _label,
  ...rest
}: SplitPaneRootProps) {
  const [current, setCurrent] = useControllableState<number>({
    value: size,
    defaultValue: defaultSize,
    onChange,
  });
  const row = direction === "horizontal";
  // The panels get their limits here (px): the first its size, the second its minimum.
  const panels = Children.map(children, (child) => {
    if (!isValidElement<SplitPanePanelProps>(child) || child.type !== SplitPanePanel) return child;
    return cloneElement(
      child,
      child.props.secondary
        ? { minSize: minSecond }
        : { defaultSize, minSize: min, ...(max !== undefined ? { maxSize: max } : {}) },
    );
  });
  return (
    <ResizablePanelGroup
      {...rest}
      unit="px"
      direction={direction}
      layout={[current, 0]}
      keyStep={keyStep}
      onLayout={(layout) => setCurrent(layout[0]!)}
      onLayoutChanged={(layout) => onChangeEnd?.(layout[0]!)}
      className={cx("fg-split", row ? "fg-split-row" : "fg-split-col", className)}
      style={{ "--fg-split-size": `${current}px`, ...style } as CSSProperties}
    >
      {panels}
    </ResizablePanelGroup>
  );
}

export interface SplitPanePanelProps
  extends
    Part<Omit<ComponentProps<"div">, "id">>,
    Pick<ResizablePanelProps, "defaultSize" | "minSize" | "maxSize"> {
  /** The pane that takes what the first leaves. Default: the first one, which has the size. */
  secondary?: boolean;
  asChild?: boolean;
}
/** One of the two panes: a `ResizablePanel`. */
export function SplitPanePanel({ secondary, className, ...rest }: SplitPanePanelProps) {
  return (
    <ResizablePanel
      className={cx(secondary ? "fg-split-second" : "fg-split-first", className)}
      {...rest}
    />
  );
}
registerResizablePart(SplitPanePanel, "panel");

export interface SplitPaneHandleProps extends Part<Omit<ComponentProps<"div">, "aria-label">> {
  /** Names the divider for assistive technology: "Resize the sidebar". */
  label: string;
}
/** The divider: drag it, or focus it and use the arrows, Home and End; a double click resets. */
export function SplitPaneHandle({ label, className, ...rest }: SplitPaneHandleProps) {
  return <ResizableHandle {...rest} aria-label={label} className={cx("fg-split-bar", className)} />;
}
registerResizablePart(SplitPaneHandle, "handle");
