// Arrows, editor half: the arrow tool (A), the ends shown on a single selected arrow, dragging an
// end onto an item to bind it there, the highlight of what an end would bind to, and the panel.

import { isDrag, type CanvasPointer, type ConnectionEnd, type Point } from "@forgeron/canvas";
import { useConnection, WorldSvg } from "@forgeron/canvas/react";
import { ArrowUpRight01Icon } from "@forgeron/icons";
import { Segmented, StrokePicker } from "@forgeron/ui";
import { arrowEnds, arrowItem, arrow as arrowCore, canBind, layoutArrowFrom } from "../arrow";
import type { DrawStyle } from "../../core/style";
import type { ArrowData, DrawItem } from "../../core/types";
import { Section } from "../../react/kit";
import { fromEditorStroke, toEditorStroke } from "../../react/pickers";
import {
  defineEditorPlugin,
  type EditorContext,
  type KindView,
  type PanelProps,
} from "../../react/plugin";
import { useSignal } from "../../react/signal";
import type { Store } from "./kit";

const TARGET = "arrow:target";

/** The top-most item under a point that an arrow may bind to, leaving out `except`. */
export function bindTargetAt(
  store: Store,
  ctx: Pick<EditorContext, "registry">,
  point: Point,
  except?: string,
): DrawItem | null {
  const ids = store.query({ type: "in-rect", rect: { x: point.x, y: point.y, w: 0.5, h: 0.5 } });
  let best: DrawItem | null = null;
  for (const id of ids) {
    const item = store.get(id) as DrawItem | undefined;
    if (!item || item.id === except || !canBind(item)) continue;
    const own = ctx.registry.kinds[item.kind]?.hitTest;
    if (own && !own(item, point)) continue;
    if (!best || item.z > best.z) best = item;
  }
  return best;
}

const arrowView: KindView = {
  keepWhenSolo: true,
  content(item, o) {
    const d = item.data as ArrowData;
    return o.solo ? (
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
  },
};

function ArrowPanel({ style, edit, dataOf }: PanelProps) {
  const d = dataOf<ArrowData>("arrow");
  return (
    <>
      <Section title="Ends">
        <Segmented
          label="Arrowheads"
          value={d?.head ?? style.head}
          onChange={(v) => {
            const head = v as DrawStyle["head"];
            edit("head", (i) => (i.data.type === "arrow" ? { data: { ...i.data, head } } : null), {
              head,
            });
          }}
          options={[
            { value: "none", label: "Line" },
            { value: "end", label: "Arrow" },
            { value: "both", label: "Both" },
          ]}
        />
      </Section>
      <Section title="Route">
        <Segmented
          label="Route"
          value={d?.route ?? style.route}
          onChange={(v) => {
            const route = v as DrawStyle["route"];
            edit(
              "route",
              (i) => (i.data.type === "arrow" ? { data: { ...i.data, route } } : null),
              { route },
            );
          }}
          options={[
            { value: "straight", label: "Straight" },
            { value: "elbow", label: "Elbow" },
          ]}
        />
      </Section>
      <StrokePicker
        label="Line"
        fields={["color", "width", "dash"]}
        maxWidth={8}
        preview={false}
        value={toEditorStroke(d?.stroke ?? style.stroke)}
        onChange={(s) => {
          const next = fromEditorStroke(s);
          const line = next.color ? next : { ...next, color: "ink" };
          edit(
            "stroke",
            (i) => (i.data.type === "arrow" ? { data: { ...i.data, stroke: line } } : null),
            { stroke: next },
          );
        }}
      />
    </>
  );
}

/** What an end being dragged would bind to, and the dashed line from the other end. */
function ArrowHighlights({ ctx }: { ctx: EditorContext }) {
  const bind = useSignal(ctx.signal<string | null>(TARGET, null));
  const connection = useConnection();
  const over = bind ?? connection?.over?.itemId ?? null;
  let wire: { from: Point; to: Point } | null = null;
  if (connection) {
    const arrow = ctx.store.get(connection.from.itemId) as DrawItem | undefined;
    if (arrow?.data.type === "arrow") {
      const ends = arrowEnds(arrow as DrawItem<ArrowData>);
      wire = {
        from: connection.from.handle === "start" ? ends.end : ends.start,
        to: connection.point,
      };
    }
  }
  const target = over ? ctx.store.get(over) : undefined;
  if (!target && !wire) return null;
  const b = target?.bounds;
  return (
    <WorldSvg className="fgd-highlights">
      {b ? (
        <rect
          className="fgd-bind"
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {wire ? (
        <line
          className="fgd-wire"
          x1={wire.from.x}
          y1={wire.from.y}
          x2={wire.to.x}
          y2={wire.to.y}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </WorldSvg>
  );
}

export const arrow = defineEditorPlugin({
  core: arrowCore,
  kinds: { arrow: arrowView },
  panels: [{ id: "arrow", type: "arrow", Component: ArrowPanel }],
  overlays: [{ id: "arrow-highlights", Component: ArrowHighlights }],
  connect: {
    canConnect: (ctx, from: ConnectionEnd, to: ConnectionEnd) => {
      const a = ctx.store.get(from.itemId);
      return (
        a?.data.type === "arrow" &&
        to.itemId !== from.itemId &&
        canBind(ctx.store.get(to.itemId) as DrawItem)
      );
    },
    onConnect(ctx, from, to, point) {
      const store = ctx.store;
      const a = store.get(from.itemId) as DrawItem<ArrowData> | undefined;
      if (!a || a.data.type !== "arrow" || (from.handle !== "start" && from.handle !== "end"))
        return;
      const ends = arrowEnds(a);
      const which = from.handle;
      const { bind: _b, ...free } = a.data[which];
      const data: ArrowData = { ...a.data, [which]: to ? { ...free, bind: to.itemId } : free };
      const g = layoutArrowFrom(
        data,
        which === "start" ? point : ends.start,
        which === "end" ? point : ends.end,
        (id) => store.get(id) as DrawItem | undefined,
      );
      store.update(a.id, { bounds: g.bounds, data: g.data }, { label: "Move arrow end" });
    },
  },
  tools: (ctx) => [
    {
      id: "arrow",
      label: "Arrow",
      shortcut: "a",
      cursor: "crosshair",
      dock: { icon: ArrowUpRight01Icon, group: "line" },
      draws: "arrow",
      down(p, { store, snap }) {
        const target = ctx.signal<string | null>(TARGET, null);
        const from = bindTargetAt(store, ctx, p.world);
        const start = from ? p.world : snap(p.world, p);
        const style = ctx.style();
        const get = (id: string) => store.get(id) as DrawItem | undefined;
        store.beginGesture("Draw arrow");
        const [item] = store.add(
          arrowItem(start, start, get, {
            ...(from ? { startBind: from.id } : {}),
            head: style.head,
            route: style.route,
            stroke: style.stroke.color ? style.stroke : { ...style.stroke, color: "ink" },
          }),
        );
        if (!item) {
          store.cancelGesture();
          return;
        }
        let moved = false;
        const place = (q: CanvasPointer) => {
          if (!moved && !isDrag(q.screen.x - p.screen.x, q.screen.y - p.screen.y)) return;
          moved = true;
          const to = bindTargetAt(store, ctx, q.world, item.id);
          const valid = to && to.id !== from?.id ? to : null;
          target.set(valid?.id ?? null);
          const end = valid ? q.world : snap(q.world, q);
          const data = item.data as ArrowData;
          const { bind: _b, ...free } = data.end;
          const g = layoutArrowFrom(
            { ...data, end: valid ? { ...free, bind: valid.id } : free },
            start,
            end,
            get,
          );
          store.update(item.id, { bounds: g.bounds, data: g.data });
        };
        return {
          move: place,
          up(q) {
            place(q);
            target.set(null);
            if (!moved) {
              store.cancelGesture();
              return;
            }
            store.endGesture();
            store.select([item.id]);
            store.setTool("select");
          },
          cancel() {
            target.set(null);
            store.cancelGesture();
          },
        };
      },
    },
  ],
});
