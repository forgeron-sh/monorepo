// A guided tour: coachmarks that point at parts of the page one after the other, with the target
// lit and the rest dimmed. Next, Back and Skip; the dots show where you are; Escape skips, the
// arrows move, focus goes to the card and returns to where it was when the tour ends. The card is a
// `Popover` anchored to the lit target, or a `Dialog` when the step has no target.
//
// `Tour` alone draws the usual card. With children they are the card, built from the parts:
//
//   <Tour label="Tour" steps={steps} open={open} onOpenChange={setOpen}>
//     <TourHeader><TourCount /><TourClose /></TourHeader>
//     <TourTitle /> <TourBody /> <TourDots />
//     <TourFooter><TourSkip /><TourNav><TourBack /><TourNext /></TourNav></TourFooter>
//   </Tour>

import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from "@forgeron/icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../button";
import { cx } from "../cx";
import { Dialog, DialogPopup, DialogPortal } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import type { Part } from "../part";
import { editorTourIndex, type EditorRect, type EditorSide } from "./editor-model";

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
  /** The card, in parts. Without them, the count, title, body, dots and buttons. */
  children?: ReactNode;
  className?: string;
}

interface TourContext {
  step: TourStep;
  steps: ReadonlyArray<TourStep>;
  at: number;
  last: boolean;
  titleId: string;
  bodyId: string;
  words: Required<TourLabels>;
  skip: () => void;
  back: () => void;
  next: () => void;
}

const Ctx = createContext<TourContext | null>(null);

function useTour(part: string): TourContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <Tour>.`);
  return ctx;
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
  children,
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
  const card = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<EditorRect | null>(null);
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
  // The card is in a portal that mounts after the tour does, and again on each step: focus it as it attaches.
  const attach = useCallback((node: HTMLDivElement | null) => {
    card.current = node;
    node?.focus();
  }, []);

  if (!isOpen || !current || typeof document === "undefined") return null;

  const last = at === count - 1;

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
    }
  };

  // Escape, a click outside and the card's own buttons are ours: the parts stay open until the tour says.
  const cardProps = {
    ref: attach,
    "aria-label": label,
    "aria-labelledby": `${id}-title`,
    "aria-describedby": current.body ? `${id}-body` : undefined,
    tabIndex: -1,
    initialFocus: card,
    finalFocus: before,
    onKeyDown,
  };

  const ctx: TourContext = {
    step: current,
    steps,
    at,
    last,
    titleId: `${id}-title`,
    bodyId: `${id}-body`,
    words,
    skip,
    back: () => go(-1),
    next,
  };

  const content = children ?? (
    <>
      <TourHeader>
        <TourCount />
        <TourClose />
      </TourHeader>
      <TourTitle />
      <TourBody />
      <TourDots />
      <TourFooter>
        <TourSkip />
        <TourNav>
          <TourBack />
          <TourNext />
        </TourNav>
      </TourFooter>
    </>
  );

  const side = current.side ?? "bottom";

  return createPortal(
    <Ctx.Provider value={ctx}>
      <div data-slot="tour" className={cx("fg-edt-tour", className)}>
        {interactive ? null : <div className="fg-edt-tour-block" aria-hidden="true" />}
        {target ? (
          // The popover anchors to the lit box, which is where the target is.
          <Popover key={current.id} open modal={interactive ? false : "trap-focus"}>
            <PopoverTrigger asChild nativeButton={false} tabIndex={-1}>
              <div
                className={spotlight ? "fg-edt-tour-lit" : "fg-edt-tour-anchor"}
                aria-hidden="true"
                style={{ left: target.x, top: target.y, width: target.w, height: target.h }}
              />
            </PopoverTrigger>
            <PopoverContent {...cardProps} side={side} align="center" className="fg-edt-tour-card">
              {content}
            </PopoverContent>
          </Popover>
        ) : (
          <>
            {spotlight ? <div className="fg-edt-tour-dim" aria-hidden="true" /> : null}
            <Dialog key={current.id} open modal={interactive ? false : "trap-focus"}>
              <DialogPortal>
                <DialogPopup
                  {...cardProps}
                  data-side="center"
                  className="fg-edt-tour-card fg-edt-tour-centered"
                >
                  {content}
                </DialogPopup>
              </DialogPortal>
            </Dialog>
          </>
        )}
      </div>
    </Ctx.Provider>,
    document.body,
  );
}

const header = (slot: string, base: string) =>
  function Box({ className, ...rest }: Part<ComponentProps<"div">>) {
    return <div data-slot={slot} {...rest} className={cx(base, className)} />;
  };

/** The top of the card: the count and the close button. */
export const TourHeader = header("tour-header", "fg-edt-tour-head");
/** The bottom of the card: Skip on the left, the buttons on the right. */
export const TourFooter = header("tour-footer", "fg-edt-tour-foot");
/** The group of Back and Next. */
export const TourNav = header("tour-nav", "fg-edt-tour-nav");

/** "Step 2 of 5". */
export function TourCount({ className, children, ...rest }: Part<ComponentProps<"span">>) {
  const t = useTour("TourCount");
  return (
    <span data-slot="tour-count" {...rest} className={cx("fg-edt-tour-count", className)}>
      {children ?? `Step ${t.at + 1} of ${t.steps.length}`}
    </span>
  );
}

/** Ends the tour, as Skip does. */
export function TourClose(props: { className?: string }) {
  const t = useTour("TourClose");
  return (
    <IconButton icon={Cancel01Icon} label="Close tour" size="sm" onClick={t.skip} {...props} />
  );
}

/** The title of the step; names the card. */
export function TourTitle({ className, children, ...rest }: Part<ComponentProps<"h2">>) {
  const t = useTour("TourTitle");
  return (
    <h2
      id={t.titleId}
      data-slot="tour-title"
      {...rest}
      className={cx("fg-edt-tour-title", className)}
    >
      {children ?? t.step.title}
    </h2>
  );
}

/** The words of the step. Nothing when it has none. */
export function TourBody({ className, children, ...rest }: Part<ComponentProps<"div">>) {
  const t = useTour("TourBody");
  const body = children ?? t.step.body;
  if (!body) return null;
  return (
    <div
      id={t.bodyId}
      data-slot="tour-body"
      {...rest}
      className={cx("fg-edt-tour-body", className)}
    >
      {body}
    </div>
  );
}

/** One dot per step; the current one is marked. */
export function TourDots({ className, ...rest }: Part<Omit<ComponentProps<"ol">, "children">>) {
  const t = useTour("TourDots");
  return (
    <ol
      aria-label="Progress"
      data-slot="tour-dots"
      {...rest}
      className={cx("fg-edt-tour-dots", className)}
    >
      {t.steps.map((s, i) => (
        <li
          key={s.id}
          className={cx(
            "fg-edt-tour-dot",
            i < t.at && "fg-edt-tour-dot-done",
            i === t.at && "fg-edt-tour-dot-now",
          )}
          aria-current={i === t.at ? "step" : undefined}
        >
          <span className="fg-visually-hidden">
            {i + 1}
            {i < t.at ? ", done" : i === t.at ? ", current" : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Skip the tour. Blank on the last step, where Done ends it. */
export function TourSkip({ children, ...rest }: Omit<ComponentProps<typeof Button>, "onClick">) {
  const t = useTour("TourSkip");
  if (t.last) return <span />;
  return (
    <Button variant="ghost" size="sm" {...(rest as object)} onClick={t.skip}>
      {children ?? t.words.skip}
    </Button>
  );
}

/** Back one step. Nothing on the first. */
export function TourBack({ children, ...rest }: Omit<ComponentProps<typeof Button>, "onClick">) {
  const t = useTour("TourBack");
  if (t.at === 0) return null;
  return (
    <Button size="sm" {...(rest as object)} onClick={t.back}>
      <Icon icon={ArrowLeft01Icon} size={12} variant="mono" />
      {children ?? t.words.back}
    </Button>
  );
}

/** Next step; "Done" on the last, which finishes the tour. */
export function TourNext({ children, ...rest }: Omit<ComponentProps<typeof Button>, "onClick">) {
  const t = useTour("TourNext");
  return (
    <Button variant="primary" size="sm" {...(rest as object)} onClick={t.next}>
      {children ?? (t.last ? t.words.done : t.words.next)}
      {t.last ? null : <Icon icon={ArrowRight01Icon} size={12} variant="mono" />}
    </Button>
  );
}
