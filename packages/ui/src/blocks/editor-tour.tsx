// A guided tour: coachmarks that point at parts of the page one after the other, with the target
// lit and the rest dimmed. Next, Back and Skip; the dots show where you are; Escape skips, the
// arrows move, focus goes to the card and returns to where it was when the tour ends.

import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from "@forgeron/icons";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import {
  editorTourIndex,
  editorTourPlacement,
  type EditorRect,
  type EditorSide,
} from "./editor-model";

/** What a step points at: a CSS selector, a ref, or a function that finds the element. */
export type TourTarget = string | RefObject<Element | null> | (() => Element | null);

export interface TourStep {
  id: string;
  /** What the step points at. Absent, or not found: the card is centred and nothing is lit. */
  target?: TourTarget;
  title: ReactNode;
  body?: ReactNode;
  /** The side of the target the card prefers. Default `bottom`; it flips when there is no room. */
  side?: EditorSide;
  /** Room around the lit target in px. Default 6. */
  padding?: number;
}

export interface TourLabels {
  next?: string;
  back?: string;
  skip?: string;
  done?: string;
}

export interface TourProps {
  /** Names the tour: "Tour of the editor". */
  label: string;
  steps: ReadonlyArray<TourStep>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The index of the step shown. */
  step?: number;
  defaultStep?: number;
  onStepChange?: (index: number) => void;
  /** After the last step's Done. */
  onFinish?: () => void;
  /** After Skip, Escape or the close button, with the step it was left on. */
  onSkip?: (index: number) => void;
  /** Lets the lit target take clicks. Default `false`: the page waits behind the tour. */
  interactive?: boolean;
  /** Dims the page around the target. Default `true`. */
  spotlight?: boolean;
  labels?: TourLabels;
  className?: string;
}

const resolve = (target: TourTarget | undefined): Element | null => {
  if (!target || typeof document === "undefined") return null;
  if (typeof target === "string") {
    try {
      return document.querySelector(target);
    } catch {
      return null;
    }
  }
  if (typeof target === "function") return target();
  return target.current;
};

const FOCUSABLE =
  "button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])";

/** Coachmarks that walk through the page: target lit, card beside it, dots, Next / Back / Skip. */
export function Tour({
  label,
  steps,
  open,
  defaultOpen = false,
  onOpenChange,
  step,
  defaultStep = 0,
  onStepChange,
  onFinish,
  onSkip,
  interactive = false,
  spotlight = true,
  labels,
  className,
}: TourProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    ...(open !== undefined ? { value: open } : {}),
    defaultValue: defaultOpen,
    ...(onOpenChange ? { onChange: onOpenChange } : {}),
  });
  const [index, setIndex] = useControllableState<number>({
    ...(step !== undefined ? { value: step } : {}),
    defaultValue: defaultStep,
    ...(onStepChange ? { onChange: onStepChange } : {}),
  });
  const words = { next: "Next", back: "Back", skip: "Skip tour", done: "Done", ...labels };
  const id = useId();
  const card = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<EditorRect | null>(null);
  const [size, setSize] = useState({ w: 320, h: 160 });
  const [view, setView] = useState({ w: 1024, h: 768 });
  const before = useRef<HTMLElement | null>(null);

  const count = steps.length;
  const at = editorTourIndex(index, 0, count);
  const current = steps[at];

  // Where the target is: now, and again whenever the page moves under it.
  const measure = useCallback(() => {
    const el = resolve(current?.target);
    const pad = current?.padding ?? 6;
    if (el) {
      const r = el.getBoundingClientRect();
      setTarget({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 });
    } else setTarget(null);
    setView({ w: window.innerWidth, h: window.innerHeight });
    const box = card.current;
    if (box) setSize({ w: box.offsetWidth, h: box.offsetHeight });
  }, [current]);

  useLayoutEffect(() => {
    if (!isOpen || !current) return;
    resolve(current.target)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    // Reading where the target is syncs with the DOM, which only a layout effect can see.
    // oxlint-disable-next-line react/set-state-in-effect
    measure();
  }, [isOpen, current, measure]);

  useEffect(() => {
    if (!isOpen) return;
    let frame = 0;
    const again = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", again);
    window.addEventListener("scroll", again, true);
    const el = resolve(current?.target);
    const watch = el && typeof ResizeObserver !== "undefined" ? new ResizeObserver(again) : null;
    if (el) watch?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", again);
      window.removeEventListener("scroll", again, true);
      watch?.disconnect();
    };
  }, [isOpen, current, measure]);

  // Focus goes to the card on each step, and back to where it was at the end.
  useEffect(() => {
    if (!isOpen) return;
    before.current = document.activeElement as HTMLElement | null;
    return () => {
      before.current?.focus?.();
    };
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) card.current?.focus();
  }, [isOpen, at]);

  if (!isOpen || !current || typeof document === "undefined") return null;

  const last = at === count - 1;
  const place = editorTourPlacement(target, size, view, current.side ?? "bottom");

  const skip = () => {
    setOpen(false);
    onSkip?.(at);
  };
  const go = (by: number) => setIndex(editorTourIndex(at, by, count));
  const next = () => {
    if (last) {
      setOpen(false);
      onFinish?.();
    } else go(1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      skip();
    } else if (event.key === "ArrowRight" && event.target === event.currentTarget) {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft" && event.target === event.currentTarget) {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Tab") {
      const items = [...(card.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
      if (items.length === 0) return;
      const first = items[0]!;
      const end = items[items.length - 1]!;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === card.current)
      ) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div className={cx("fg-edt-tour", className)}>
      {interactive ? null : <div className="fg-edt-tour-block" aria-hidden="true" />}
      {spotlight ? (
        target ? (
          <div
            className="fg-edt-tour-lit"
            aria-hidden="true"
            style={{ left: target.x, top: target.y, width: target.w, height: target.h }}
          />
        ) : (
          <div className="fg-edt-tour-dim" aria-hidden="true" />
        )
      ) : null}
      <div
        ref={card}
        role="dialog"
        aria-modal="false"
        aria-label={label}
        aria-labelledby={`${id}-title`}
        aria-describedby={current.body ? `${id}-body` : undefined}
        tabIndex={-1}
        data-side={place.side}
        className="fg-edt-tour-card"
        style={{ left: place.x, top: place.y }}
        onKeyDown={onKeyDown}
      >
        {place.side !== "center" ? (
          <span
            className="fg-edt-tour-arrow"
            aria-hidden="true"
            style={
              place.side === "top" || place.side === "bottom"
                ? { left: place.arrow - 5 }
                : { top: place.arrow - 5 }
            }
          />
        ) : null}
        <div className="fg-edt-tour-head">
          <span className="fg-edt-tour-count">
            Step {at + 1} of {count}
          </span>
          <IconButton icon={Cancel01Icon} label="Close tour" size="sm" onClick={skip} />
        </div>
        <h2 id={`${id}-title`} className="fg-edt-tour-title">
          {current.title}
        </h2>
        {current.body ? (
          <div id={`${id}-body`} className="fg-edt-tour-body">
            {current.body}
          </div>
        ) : null}
        <ol className="fg-edt-tour-dots" aria-label="Progress">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={cx(
                "fg-edt-tour-dot",
                i < at && "fg-edt-tour-dot-done",
                i === at && "fg-edt-tour-dot-now",
              )}
              aria-current={i === at ? "step" : undefined}
            >
              <span className="fg-visually-hidden">
                {i + 1}
                {i < at ? ", done" : i === at ? ", current" : ""}
              </span>
            </li>
          ))}
        </ol>
        <div className="fg-edt-tour-foot">
          {last ? (
            <span />
          ) : (
            <Button variant="ghost" size="sm" onClick={skip}>
              {words.skip}
            </Button>
          )}
          <div className="fg-edt-tour-nav">
            {at > 0 ? (
              <Button size="sm" onClick={() => go(-1)}>
                <Icon icon={ArrowLeft01Icon} size={12} variant="mono" />
                {words.back}
              </Button>
            ) : null}
            <Button variant="primary" size="sm" onClick={next}>
              {last ? words.done : words.next}
              {last ? null : <Icon icon={ArrowRight01Icon} size={12} variant="mono" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
