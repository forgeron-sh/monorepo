// What each item looks like in the editor: its paint (shared with the export) in an SVG the size
// of its box, and the text that the DOM edits on top. A child of a frame is clipped by the frame.

import { createElement, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { Bounds } from "@forgeron/canvas";
import { colorCss, STICKY_COLORS } from "../core/palette";
import { pagePaint, paintItem, type SvgNode } from "../core/paint";
import { STICKY_PADDING, STICKY_TEXT } from "../core/text";
import type { DrawItem } from "../core/types";

export function toReact(nodes: ReadonlyArray<SvgNode>, prefix = ""): ReactNode[] {
  return nodes.map((node, i) =>
    createElement(
      node.tag,
      { key: `${prefix}${i}`, ...node.attrs },
      node.text !== undefined
        ? node.text
        : node.children
          ? toReact(node.children, `${prefix}${i}.`)
          : undefined,
    ),
  );
}

/** The CSS clip of an item by its frame: what reaches outside the frame is cut. */
export function frameClip(item: Bounds, frame: Bounds | undefined): CSSProperties | undefined {
  if (!frame) return undefined;
  const top = Math.max(0, frame.y - item.y);
  const left = Math.max(0, frame.x - item.x);
  const right = Math.max(0, item.x + item.w - (frame.x + frame.w));
  const bottom = Math.max(0, item.y + item.h - (frame.y + frame.h));
  if (!top && !left && !right && !bottom) return undefined;
  return { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px)` };
}

export interface ItemViewOptions {
  idPrefix: string;
  frame?: Bounds;
  /** The item's text is being typed: a field replaces it. */
  editing?: {
    value: string;
    onChange: (text: string, height: number | null) => void;
    onDone: (cancel: boolean) => void;
  };
  /** The single selected arrow shows its ends, to drag them onto another item. */
  showEnds?: boolean;
  /**
   * Far out (a zoom under `FAR_ZOOM`): shapes, notes and texts are drawn as plain boxes, with no
   * pattern and no words, which nobody reads at that size and which cost the most to paint.
   */
  far?: boolean;
}

/** A field over the item that grows with its text and reports its measured height. */
function EditField({
  value,
  onChange,
  onDone,
  className,
  style,
  label,
}: NonNullable<ItemViewOptions["editing"]> & {
  className: string;
  style?: CSSProperties;
  label: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  return (
    <textarea
      ref={ref}
      className={className}
      style={style}
      aria-label={label}
      value={value}
      data-canvas-interactive=""
      spellCheck={false}
      onChange={(e) => {
        const el = e.currentTarget;
        // The field's own height says how tall the text is, when there is a layout to ask.
        el.style.height = "auto";
        const h = el.scrollHeight || null;
        el.style.height = "";
        onChange(el.value, h);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          onDone(e.key === "Escape" && value === "");
        }
      }}
      onBlur={() => onDone(false)}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}

/** Under this zoom the editor draws the far view of each item. */
export const FAR_ZOOM = 0.35;

/** A pattern drawn far out: its colour, as light as its dither. */
const wash = (color: string, share: number) =>
  `color-mix(in srgb, ${color} ${Math.round(share * 100)}%, transparent)`;

function farStyle(item: DrawItem): CSSProperties | null {
  const d = item.data;
  switch (d.type) {
    case "shape": {
      const fill =
        d.fill.type === "none"
          ? "transparent"
          : d.fill.type === "solid"
            ? colorCss(d.fill.color)
            : wash(colorCss(d.fill.color), 0.4);
      const edge = d.stroke.color ? colorCss(d.stroke.color) : "transparent";
      return {
        background: fill,
        border: `${Math.max(1, d.stroke.width)}px solid ${edge}`,
        ...(item.kind === "ellipse" ? { borderRadius: "50%" } : {}),
        ...(item.kind === "diamond"
          ? {
              clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
              background: fill === "transparent" ? wash(edge, 0.35) : fill,
            }
          : {}),
      };
    }
    case "sticky": {
      const c = STICKY_COLORS[d.color] ?? STICKY_COLORS.amber;
      return { background: colorCss(c.paper), borderTop: `4px solid ${colorCss(c.edge)}` };
    }
    case "text":
      return d.text ? { background: wash(colorCss(d.color), 0.25) } : null;
    default:
      return null;
  }
}

export function DrawItemView({ item, options }: { item: DrawItem; options: ItemViewOptions }) {
  const b = item.bounds;
  const d = item.data;
  if (options.far && d.type === "pen") {
    // Far out, a stroke is its line: its pixels would be smaller than a screen pixel.
    const pts: string[] = [];
    for (let i = 0; i + 1 < d.points.length; i += 2)
      pts.push(`${d.points[i]! + 0.5},${d.points[i + 1]! + 0.5}`);
    return (
      <div className="fgd-item" data-type="pen" style={frameClip(b, options.frame)}>
        <svg
          className="fgd-svg"
          viewBox={`0 0 ${d.cols} ${d.rows}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={pts.join(" ")}
            fill="none"
            stroke={colorCss(d.color)}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }
  if (options.far && !options.editing) {
    const far = farStyle(item);
    if (far) {
      const clip = frameClip(b, options.frame);
      return <div className="fgd-item fgd-far" data-type={d.type} style={{ ...far, ...clip }} />;
    }
  }
  const nodes = paintItem(item, pagePaint(options.idPrefix));
  const clip = frameClip(b, options.frame);
  const svg = nodes.length ? (
    <svg
      className="fgd-svg"
      viewBox={`${b.x} ${b.y} ${Math.max(b.w, 0.01)} ${Math.max(b.h, 0.01)}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {toReact(nodes)}
    </svg>
  ) : null;

  let content: ReactNode = null;
  const edit = options.editing;
  switch (d.type) {
    case "sticky":
      content = edit ? (
        <EditField {...edit} className="fgd-sticky-text fgd-field" label="Sticky note text" />
      ) : (
        <div className="fgd-sticky-text">{d.text}</div>
      );
      break;
    case "text": {
      const style = { fontSize: d.size, color: colorCss(d.color), textAlign: d.align } as const;
      content = edit ? (
        <EditField {...edit} className="fgd-text fgd-field" style={style} label="Text" />
      ) : (
        <div className="fgd-text" style={style}>
          {d.text}
        </div>
      );
      break;
    }
    case "shape":
      content = edit ? (
        <EditField {...edit} className="fgd-label fgd-field" label="Shape label" />
      ) : d.text ? (
        <div className="fgd-label">
          <span>{d.text}</span>
        </div>
      ) : null;
      break;
    case "frame":
      content = (
        <span className="fgd-frame-name" title={d.name}>
          {d.name}
        </span>
      );
      break;
    case "arrow":
      content = options.showEnds ? (
        <>
          <span
            className="fgd-end"
            data-canvas-handle="start"
            style={{ left: d.start.x, top: d.start.y }}
            aria-hidden="true"
          />
          <span
            className="fgd-end"
            data-canvas-handle="end"
            style={{ left: d.end.x, top: d.end.y }}
            aria-hidden="true"
          />
        </>
      ) : null;
      break;
  }
  return (
    <div
      className="fgd-item"
      data-type={d.type}
      style={{
        ...clip,
        ...(d.type === "sticky"
          ? ({
              "--fgd-pad": `${STICKY_PADDING}px`,
              "--fgd-size": `${STICKY_TEXT}px`,
            } as CSSProperties)
          : {}),
      }}
    >
      {svg}
      {content}
    </div>
  );
}
