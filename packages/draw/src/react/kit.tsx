// Pieces the editor halves share: the SVG nodes of the core as React elements, the clip of an item
// by its frame, the field that edits an item's text in place, the pickers' conversions between the
// board's colours and ui's. No plugin imports this folder's editor, so the editor halves can use it.

import type { Bounds } from "@forgeron/canvas";
import { createElement, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { SvgNode } from "../core/svg";
import type { ItemViewOptions } from "./plugin";

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

/** A field over the item that grows with its text and reports its measured height. */
export function EditField({
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

/** A labelled row of the properties panel. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fgd-insp-row" role="group" aria-label={title}>
      <span className="fgd-insp-name" aria-hidden="true">
        {title}
      </span>
      {children}
    </div>
  );
}
