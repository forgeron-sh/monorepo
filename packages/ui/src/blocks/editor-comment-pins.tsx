// Comment pins over a canvas or a document: a numbered marker with a tail, open or resolved, that
// opens a panel for the thread. `CommentPin` is one marker; `PinLayer` places many from their
// world positions and the view, and keeps one thread open at a time. The thread itself is a slot.
//
// `PinLayer` with no children places a pin for each of `pins`. With children it is the root of
// the parts:
//
//   <PinLayer label="Comments" pins={pins} view={view}>
//     {pins.map((pin, i) => (
//       <PinLayerItem key={pin.id} pin={pin} index={i}>
//         <PinLayerTrigger />
//         <PinLayerThread>{pin.preview}</PinLayerThread>
//       </PinLayerItem>
//     ))}
//   </PinLayer>

import { Cancel01Icon, Tick02Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from "../popover";
import { renderPart, type Part } from "../part";
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
  /** The one child element becomes the pin (shadcn's `asChild`), for a link or a Base UI trigger. */
  asChild?: boolean;
}

/** One numbered comment marker; `open` or `resolved`, never told by colour alone. */
export function CommentPin({
  number,
  state = "open",
  unread,
  active,
  author,
  asChild,
  className,
  ...rest
}: CommentPinProps) {
  const resolved = state === "resolved";
  return renderPart(
    "button",
    cx("fg-edt-pin", resolved && "fg-edt-pin-resolved", active && "fg-edt-pin-active", className),
    asChild,
    {
      type: "button",
      "data-slot": "comment-pin",
      "aria-label": `Comment ${number}${author ? ` by ${author}` : ""}, ${resolved ? "resolved" : "open"}${unread ? ", unread" : ""}`,
      "aria-expanded": active,
      ...rest,
      children: (
        <>
          {resolved ? (
            <Icon icon={Tick02Icon} size={12} variant="mono" />
          ) : (
            <span className="fg-edt-pin-n">{number}</span>
          )}
          {unread ? <span className="fg-edt-pin-unread" aria-hidden="true" /> : null}
        </>
      ),
    },
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

export interface PinLayerProps extends Part<Omit<ComponentProps<"div">, "children">> {
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
  /** The parts: a `PinLayerItem` per pin. Without them, one is drawn for each of `pins`. */
  children?: ReactNode;
}

interface LayerContext {
  view: EditorView | undefined;
  open: string | null;
  setOpen: (id: string | null) => void;
  renderThread: PinLayerProps["renderThread"];
  hideResolved: boolean | undefined;
  threadWidth: number;
}

const LayerCtx = createContext<LayerContext | null>(null);

function useLayer(part: string): LayerContext {
  const ctx = useContext(LayerCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <PinLayer>.`);
  return ctx;
}

interface ItemContext {
  pin: EditorPinData;
  number: number;
  shown: boolean;
}

const ItemCtx = createContext<ItemContext | null>(null);

function useItem(part: string): ItemContext {
  const ctx = useContext(ItemCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <PinLayerItem>.`);
  return ctx;
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
  children,
  className,
  ...rest
}: PinLayerProps) {
  const [open, setOpen] = useControllableState<string | null>({
    ...(openId !== undefined ? { value: openId } : {}),
    defaultValue: defaultOpenId ?? null,
    ...(onOpenChange ? { onChange: onOpenChange } : {}),
  });
  const ctx: LayerContext = { view, open, setOpen, renderThread, hideResolved, threadWidth };
  return (
    <LayerCtx.Provider value={ctx}>
      <div
        role="group"
        aria-label={label}
        data-slot="pin-layer"
        {...rest}
        className={cx("fg-edt-pins", className)}
      >
        {children ??
          pins.map((pin, i) => (
            <PinLayerItem key={pin.id} pin={pin} index={i}>
              <PinLayerTrigger />
              <PinLayerThread />
            </PinLayerItem>
          ))}
      </div>
    </LayerCtx.Provider>
  );
}

export type PinLayerItemProps = Part<Omit<ComponentProps<"div">, "children">> & {
  pin: EditorPinData;
  /** Its place in the list, for the number it gets when it has none. */
  index?: number;
  /** A `PinLayerTrigger` and a `PinLayerThread`. */
  children?: ReactNode;
};

/** One pin at its place, with the popover of its thread. */
export function PinLayerItem({
  pin,
  index = 0,
  className,
  style,
  children,
  ...rest
}: PinLayerItemProps) {
  const layer = useLayer("PinLayerItem");
  if (layer.hideResolved && pin.resolved) return null;
  const at = layer.view ? editorProject(pin, layer.view) : { x: pin.x, y: pin.y };
  const number = pin.number ?? index + 1;
  const shown = layer.open === pin.id;
  return (
    <ItemCtx.Provider value={{ pin, number, shown }}>
      <div
        data-slot="pin-layer-item"
        {...rest}
        className={cx("fg-edt-pin-at", className)}
        style={{ left: at.x, top: at.y, ...style }}
      >
        <Popover
          open={shown}
          onOpenChange={(next) =>
            layer.setOpen(next ? pin.id : layer.open === pin.id ? null : layer.open)
          }
        >
          {children}
        </Popover>
      </div>
    </ItemCtx.Provider>
  );
}

/** The marker that opens the thread. */
export function PinLayerTrigger({ className, ...rest }: Omit<CommentPinProps, "number">) {
  const { pin, number, shown } = useItem("PinLayerTrigger");
  return (
    <PopoverTrigger asChild>
      <CommentPin
        number={number}
        state={pin.resolved ? "resolved" : "open"}
        active={shown}
        {...(pin.unread ? { unread: true } : {})}
        {...(pin.author ? { author: pin.author } : {})}
        {...rest}
        {...(className ? { className } : {})}
      />
    </PopoverTrigger>
  );
}

/** The panel of the thread: your children, or the layer's `renderThread`, or the pin's author and preview. */
export function PinLayerThread({
  className,
  children,
  ...rest
}: Part<Omit<ComponentProps<typeof PopoverContent>, "side" | "align">>) {
  const layer = useLayer("PinLayerThread");
  const { pin, number } = useItem("PinLayerThread");
  const title = `Comment ${number}${pin.resolved ? " · resolved" : ""}`;
  return (
    <PopoverContent
      side="right"
      align="start"
      data-slot="pin-layer-thread"
      {...rest}
      style={{ width: layer.threadWidth, maxWidth: "none", ...rest.style }}
      className={className}
    >
      <div className="fg-popover-head">
        <PopoverTitle>{title}</PopoverTitle>
        <PopoverClose className="fg-popover-x" aria-label={`Close Comment ${number}`}>
          <Icon icon={Cancel01Icon} size={12} variant="mono" />
        </PopoverClose>
      </div>
      {children ??
        (layer.renderThread ? (
          layer.renderThread(pin, () => layer.setOpen(null))
        ) : (
          <div className="fg-edt-pin-thread">
            {pin.author ? <strong>{pin.author}</strong> : null}
            {pin.preview ? <p>{pin.preview}</p> : null}
          </div>
        ))}
    </PopoverContent>
  );
}
