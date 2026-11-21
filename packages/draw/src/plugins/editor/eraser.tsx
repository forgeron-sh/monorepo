// The eraser, editor half: the eraser tool (E) removes what the pointer crosses, in one undo step on
// release, and highlights what it will remove while it moves.

import type { Point } from "@forgeron/canvas";
import { WorldSvg } from "@forgeron/canvas/react";
import { EraserIcon } from "@forgeron/icons";
import { eraser as eraserCore } from "../lines";
import { defineEditorPlugin, type EditorContext } from "../../react/plugin";
import { useSignal } from "../../react/signal";

const ERASING = "eraser:ids";

function ErasingHighlights({ ctx }: { ctx: EditorContext }) {
  const ids = useSignal(ctx.signal<ReadonlyArray<string>>(ERASING, []));
  if (ids.length === 0) return null;
  return (
    <WorldSvg className="fgd-highlights">
      {ids.map((id) => {
        const item = ctx.store.get(id);
        if (!item) return null;
        const b = item.bounds;
        return (
          <rect
            key={`erase-${id}`}
            className="fgd-erasing"
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </WorldSvg>
  );
}

export const eraser = defineEditorPlugin({
  core: eraserCore,
  overlays: [{ id: "eraser-highlights", Component: ErasingHighlights }],
  tools: (ctx) => [
    {
      id: "eraser",
      label: "Eraser",
      shortcut: "e",
      cursor: "crosshair",
      dock: { icon: EraserIcon, group: "line" },
      down(p, { store }) {
        const erasing = ctx.signal<ReadonlyArray<string>>(ERASING, []);
        const hits = new Set<string>();
        let last = p.world;
        const touch = (q: Point) => {
          // Every few world units between two samples, so a fast stroke misses nothing.
          const steps = Math.max(1, Math.ceil(Math.hypot(q.x - last.x, q.y - last.y) / 4));
          for (let i = 1; i <= steps; i++) {
            const at = {
              x: last.x + ((q.x - last.x) * i) / steps,
              y: last.y + ((q.y - last.y) * i) / steps,
            };
            const hit = store.query({ type: "hit", point: at });
            if (hit && !hit.locked) hits.add(hit.id);
          }
          last = q;
          erasing.set([...hits]);
        };
        const first = store.query({ type: "hit", point: p.world });
        if (first && !first.locked) hits.add(first.id);
        erasing.set([...hits]);
        return {
          move: (q) => touch(q.world),
          up(q) {
            touch(q.world);
            erasing.set([]);
            if (hits.size) store.remove(hits, { label: "Erase" });
          },
          cancel: () => erasing.set([]),
        };
      },
    },
  ],
});
