// Comment pins over a canvas or a document: a numbered marker with a tail, open or resolved, that
// opens a panel for the thread. `CommentPin` is one marker; `PinLayer` places many from their
// world positions and the view, and keeps one thread open at a time. The thread itself is a slot.

import { Tick02Icon } from "@forgeron/icons";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Popover } from "../popover";
import { editorProject, type EditorView } from "./editor-model";

export interface CommentPinProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> {
  /** The number written in the pin. */
  number: number;
  /** `resolved` draws a hollow pin with a tick and says so. Default `open`. */
  state?: "open" | "resolved";
  /** The thread has something you have not read: a mark on the corner. */
  unread?: boolean;
  /** Its thread is open: the pin is drawn pressed. */
  active?: boolean;
  /** Who wrote it, for the name read by assistive technology. */
  author?: string;
}

/** One numbered comment marker; `open` or `resolved`, never told by colour alone. */
export function CommentPin({
  number,
  state = "open",
  unread,
  active,
  author,
  className,
  ...rest
}: CommentPinProps) {
  const resolved = state === "resolved";
  return (
    <button
      type="button"
      aria-label={`Comment ${number}${author ? ` by ${author}` : ""}, ${resolved ? "resolved" : "open"}${unread ? ", unread" : ""}`}
      aria-expanded={active}
      {...rest}
      className={cx(
        "fg-edt-pin",
        resolved && "fg-edt-pin-resolved",
        active && "fg-edt-pin-active",
        className,
      )}
    >
      {resolved ? (
        <Icon icon={Tick02Icon} size={12} variant="mono" />
      ) : (
        <span className="fg-edt-pin-n">{number}</span>
      )}
      {unread ? <span className="fg-edt-pin-unread" aria-hidden="true" /> : null}
    </button>
  );
}

export interface EditorPinData {
  id: string;
  /** Where its tail points, in world units (or screen pixels when no `view` is given). */
  x: number;
  y: number;
  /** Default: its place in the list, from 1. */
  number?: number;
  resolved?: boolean;
  unread?: boolean;
  author?: string;
  /** The first words of the thread, shown in the panel when no `renderThread` is given. */
  preview?: ReactNode;
}

export interface PinLayerProps {
  /** Names the layer: "Comments". */
  label: string;
  pins: ReadonlyArray<EditorPinData>;
  /** What the canvas shows, to turn world positions into screen ones. Without it, `x` and `y` are pixels. */
  view?: EditorView;
  /** The id of the pin whose thread is open. */
  openId?: string | null;
  defaultOpenId?: string | null;
  onOpenChange?: (id: string | null) => void;
  /** The thread of a pin, in the panel that opens from it. */
  renderThread?: (pin: EditorPinData, close: () => void) => ReactNode;
  /** Leaves resolved pins out. */
  hideResolved?: boolean;
  /** Width of the panel in px. Default 280. */
  threadWidth?: number;
  className?: string;
}

/** Places comment pins over a canvas and opens one thread at a time. Lay it over the canvas: it takes no clicks itself. */
export function PinLayer({
  label,
  pins,
  view,
  openId,
  defaultOpenId,
  onOpenChange,
  renderThread,
  hideResolved,
  threadWidth = 280,
  className,
}: PinLayerProps) {
  const [open, setOpen] = useControllableState<string | null>({
    ...(openId !== undefined ? { value: openId } : {}),
    defaultValue: defaultOpenId ?? null,
    ...(onOpenChange ? { onChange: onOpenChange } : {}),
  });
  return (
    <div role="group" aria-label={label} className={cx("fg-edt-pins", className)}>
      {pins.map((pin, i) => {
        if (hideResolved && pin.resolved) return null;
        const at = view ? editorProject(pin, view) : { x: pin.x, y: pin.y };
        const n = pin.number ?? i + 1;
        const shown = open === pin.id;
        return (
          <div key={pin.id} className="fg-edt-pin-at" style={{ left: at.x, top: at.y }}>
            <Popover
              label={`Comment ${n}`}
              title={`Comment ${n}${pin.resolved ? " · resolved" : ""}`}
              open={shown}
              onOpenChange={(next) => setOpen(next ? pin.id : open === pin.id ? null : open)}
              side="right"
              align="start"
              width={threadWidth}
              showClose
              trigger={
                <CommentPin
                  number={n}
                  state={pin.resolved ? "resolved" : "open"}
                  active={shown}
                  {...(pin.unread ? { unread: true } : {})}
                  {...(pin.author ? { author: pin.author } : {})}
                />
              }
            >
              {renderThread ? (
                renderThread(pin, () => setOpen(null))
              ) : (
                <div className="fg-edt-pin-thread">
                  {pin.author ? <strong>{pin.author}</strong> : null}
                  {pin.preview ? <p>{pin.preview}</p> : null}
                </div>
              )}
            </Popover>
          </div>
        );
      })}
    </div>
  );
}
