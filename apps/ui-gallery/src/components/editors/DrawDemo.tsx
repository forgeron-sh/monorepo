import {
  arrowItem,
  frameItem,
  parseBoard,
  penFromPoints,
  shapeItem,
  stickyItem,
  textItem,
  type DrawItem,
} from "@forgeron/draw";
import { DrawEditor, useDrawStore } from "@forgeron/draw/react";
import type { NewItem } from "@forgeron/canvas";
import type { DrawData } from "@forgeron/draw";
import { useEffect } from "react";

// The live board of the gallery: a frame with a small plan (stickies, shapes in dither fills,
// arrows bound to them, a title), a sketch frame with pixel pen strokes. `?items=2000` swaps it
// for a generated board of that many items, a tenth of them pen strokes, to measure pan and zoom;
// `?board=q1-workshop` for a demo board of @forgeron/libraries/boards, loaded when asked for.

type Store = ReturnType<typeof useDrawStore>;

/** The demo boards of @forgeron/libraries/boards, each loaded when asked for. */
const BOARDS: Record<string, () => Promise<{ default: string }>> = {
  "q1-workshop": () => import("@forgeron/libraries/boards/q1-workshop.draw.json?raw"),
};

function wave(x: number, y: number, len: number, amp: number, seed: number) {
  return Array.from({ length: 24 }, (_, i) => ({
    x: x + (i / 23) * len,
    y: y + Math.sin(i / 3 + seed) * amp,
  }));
}

function demoBoard(store: Store) {
  const get = (id: string) => store.get(id) as DrawItem | undefined;
  store.add(frameItem({ x: 0, y: 0, w: 920, h: 520 }, "Sprint plan"));
  store.add(textItem({ x: 40, y: 48 }, "Ship the draw editor", 28));
  const [idea, build, ship] = store.add([
    shapeItem(
      "rectangle",
      { x: 40, y: 140, w: 180, h: 100 },
      {
        fill: { type: "pattern", pattern: "dots-25", color: "muted" },
      },
      "Model",
    ),
    shapeItem(
      "diamond",
      { x: 340, y: 130, w: 180, h: 120 },
      {
        fill: { type: "solid", color: "raised" },
        stroke: { color: "accent", width: 2, dash: "solid" },
      },
      "Review",
    ),
    shapeItem(
      "ellipse",
      { x: 640, y: 140, w: 200, h: 100 },
      {
        fill: { type: "pattern", pattern: "hatch", color: "dim" },
      },
      "Ship",
    ),
  ]);
  store.add([
    arrowItem({ x: 0, y: 0 }, { x: 0, y: 0 }, get, { startBind: idea!.id, endBind: build!.id }),
    arrowItem({ x: 0, y: 0 }, { x: 0, y: 0 }, get, {
      startBind: build!.id,
      endBind: ship!.id,
      route: "elbow",
    }),
  ]);
  store.add([
    stickyItem({ x: 40, y: 300 }, "Arrows follow when you move a shape.", "amber"),
    stickyItem({ x: 240, y: 300 }, "Double-click a note to write in it.", "green"),
    stickyItem({ x: 440, y: 300 }, "P draws on the pixel grid.", "rose"),
    stickyItem({ x: 640, y: 300 }, "F frames, then export PNG or SVG.", "grey"),
  ]);
  store.add(frameItem({ x: 1000, y: 0, w: 420, h: 520 }, "Sketch"));
  const strokes: Array<NewItem<DrawData>> = [];
  for (let i = 0; i < 5; i++) {
    const g = penFromPoints(wave(1040, 80 + i * 80, 340, 18 - i * 3, i), {
      color: i % 2 ? "accent" : "ink",
      weight: i === 0 ? 2 : 1,
    });
    if (g) strokes.push({ kind: "pen", ...g });
  }
  store.add(strokes);
  store.add(textItem({ x: 1040, y: 460 }, "Pixel pen, simplified", 16, "muted"));
}

/** A generated board of `n` items, a tenth of them pen strokes, for the perf measure. */
function bigBoard(store: Store, n: number) {
  const items: Array<NewItem<DrawData>> = [];
  const cols = Math.ceil(Math.sqrt(n));
  const pens = Math.round(n / 10);
  const kinds = ["rectangle", "ellipse", "diamond", "sticky", "text"] as const;
  const fills = ["dots-25", "dots-50", "hatch", "cross"];
  for (let i = 0; i < n; i++) {
    const x = (i % cols) * 220;
    const y = Math.floor(i / cols) * 180;
    if (i % 10 === 0 && items.filter((t) => t.kind === "pen").length < pens) {
      const g = penFromPoints(wave(x, y + 60, 160, 20, i), { color: "accent", weight: 1 });
      if (g) items.push({ kind: "pen", ...g });
      continue;
    }
    const k = kinds[i % kinds.length]!;
    if (k === "sticky") items.push(stickyItem({ x, y }, `Note ${i}`, "amber"));
    else if (k === "text") items.push(textItem({ x, y }, `Text ${i}`, 20));
    else
      items.push(
        shapeItem(
          k,
          { x, y, w: 160, h: 120 },
          {
            fill: { type: "pattern", pattern: fills[i % fills.length]!, color: "muted" },
          },
        ),
      );
  }
  store.add(items);
}

export default function DrawDemo() {
  const store = useDrawStore();
  useEffect(() => {
    if (store.getState().items.length) return;
    const params = new URLSearchParams(location.search);
    const board = BOARDS[params.get("board") ?? ""];
    if (board) {
      let live = true;
      const t = performance.now();
      void board().then(({ default: json }) => {
        if (!live) return;
        store.replace(parseBoard(json).items);
        const fit = () => store.fitView({ padding: 32 });
        if (store.getState().size.w) fit();
        else {
          const stop = store.subscribe(() => {
            if (!store.getState().size.w) return;
            stop();
            fit();
          });
        }
        (window as unknown as { __draw: unknown }).__draw = {
          store,
          loadMs: performance.now() - t,
        };
      });
      return () => {
        live = false;
      };
    }
    const n = Number(params.get("items") ?? 0);
    if (n > 0) bigBoard(store, Math.min(n, 20000));
    else demoBoard(store);
    store.replace(store.getState().items);
    // On a phone, the plan frame alone: the whole board would be too small to read.
    const fit = () => {
      const narrow = store.getState().size.w < 600 && n === 0;
      const plan = store.getState().items.find((i) => i.kind === "frame");
      store.fitView(narrow && plan ? { ids: [plan.id], padding: 12 } : { padding: 32 });
    };
    if (store.getState().size.w) fit();
    else {
      const stop = store.subscribe(() => {
        if (store.getState().size.w) {
          stop();
          fit();
        }
      });
      return stop;
    }
  }, [store]);
  return <DrawEditor store={store} label="Draw demo board" className="ed-draw" />;
}
