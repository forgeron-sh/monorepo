// What each item looks like in the editor: its paint (the kind's own, shared with the export) in an
// SVG the size of its box, and what the kind's editor half puts on top of it (the text that the DOM
// edits, a frame's name, an arrow's ends). A child of a frame is clipped by the frame. An item whose
// kind no plugin of the editor knows is drawn as a labelled dashed box: kept, never lost.

import type { CSSProperties, ReactNode } from "react";
import { pagePaint } from "../core/svg";
import type { Registry } from "../core/plugin";
import type { DrawItem } from "../core/types";
import { frameClip, toReact } from "./kit";
import type { ItemViewOptions, KindView } from "./plugin";

export { frameClip, toReact } from "./kit";
export { FAR_ZOOM } from "../core/far";
export type { ItemViewOptions } from "./plugin";

export interface ItemViewSlots {
  registry: Registry;
  kinds: ReadonlyMap<string, KindView>;
}

/** An item no plugin of the editor knows: a labelled dashed box, in the place the item has. */
export function UnknownItem({ item }: { item: DrawItem }) {
  return (
    <div className="fgd-item fgd-unknown" data-type="unknown" data-kind={item.kind}>
      <span className="fgd-unknown-label">Unsupported item: {item.kind}</span>
    </div>
  );
}

export function DrawItemView({
  item,
  options,
  slots,
}: {
  item: DrawItem;
  options: ItemViewOptions;
  slots: ItemViewSlots;
}) {
  const spec = slots.registry.kind(item.kind);
  if (!spec) return <UnknownItem item={item} />;
  const b = item.bounds;
  const view = slots.kinds.get(item.kind);
  const clip = frameClip(b, options.frame);
  if (options.far) {
    const node = view?.farNode?.(item, options);
    if (node) return <>{node}</>;
    if (!options.editing) {
      const far = view?.farStyle?.(item);
      if (far) {
        return (
          <div
            className="fgd-item fgd-far"
            data-type={item.data.type}
            style={{ ...far, ...clip }}
          />
        );
      }
    }
  }
  const nodes = spec.paint(item, pagePaint(options.idPrefix));
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
  const content: ReactNode = view?.content?.(item, options) ?? null;
  const own: CSSProperties | undefined = view?.style?.(item);
  return (
    <div
      className="fgd-item"
      data-type={item.data.type}
      style={own || clip ? { ...clip, ...own } : undefined}
    >
      {svg}
      {content}
    </div>
  );
}
