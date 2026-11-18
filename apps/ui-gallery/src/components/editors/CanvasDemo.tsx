import { center, type Item, type KindMap } from "@forgeron/canvas";
import {
  Canvas,
  Minimap,
  useCanvasStore,
  ZoomControls,
  type Primitive,
} from "@forgeron/canvas/react";
import { useEffect } from "react";

// The live canvas of the gallery: placeholder items of three kinds (a block, a round one with its
// own hit test, a locked frame), the zoom controls with undo, the minimap. Flow and draw replace
// the placeholders with their own kinds.

interface Placeholder {
  title: string;
  note?: string;
}

const kinds: KindMap<Placeholder> = {
  block: {
    resize: { minW: 120, minH: 60 },
  },
  round: {
    resize: { keepAspect: true, minW: 40, minH: 40 },
    // An ellipse: the corners of its box are not part of it.
    hitTest: (i, p) => {
      const c = center(i.bounds);
      const rx = i.bounds.w / 2;
      const ry = i.bounds.h / 2;
      return ((p.x - c.x) / rx) ** 2 + ((p.y - c.y) / ry) ** 2 <= 1;
    },
  },
  frame: {},
};

const at = (
  id: string,
  kind: string,
  x: number,
  y: number,
  w: number,
  h: number,
  z: number,
  data: Placeholder,
  locked = false,
): Item<Placeholder> => ({
  id,
  kind,
  bounds: { x, y, w, h },
  z,
  data,
  ...(locked ? { locked } : {}),
});

const items: Item<Placeholder>[] = [
  at("frame", "frame", -40, -60, 760, 360, 0, { title: "Locked frame", note: "locked" }, true),
  at("trigger", "block", 0, 0, 180, 80, 1, { title: "Trigger", note: "on.record" }),
  at("fetch", "block", 240, 0, 180, 80, 2, { title: "Fetch", note: "http.get" }),
  at("branch", "round", 480, 0, 80, 80, 3, { title: "If" }),
  at("write", "block", 240, 140, 180, 80, 4, { title: "Write", note: "db.insert" }),
  at("notify", "block", 480, 140, 180, 80, 5, { title: "Notify", note: "mail.send" }),
  at("note", "block", 0, 140, 180, 120, 6, {
    title: "Note",
    note: "Drag me, resize me, nudge me.",
  }),
];

// The renderer draws the shapes (rect, ellipse); the DOM overlay only carries the text.
function primitive(item: Item<Placeholder>): Primitive {
  if (item.kind === "round") return { shape: "ellipse", fill: "--bg", stroke: "--line-strong" };
  if (item.kind === "frame") return { shape: "rect", fill: "transparent", stroke: "--line" };
  return { shape: "rect", fill: "--bg", stroke: "--line-strong" };
}

function renderItem(item: Item<Placeholder>) {
  if (item.kind === "frame") return <span className="ed-frame-title">{item.data.title}</span>;
  if (item.kind === "round") return <div className="ed-round">{item.data.title}</div>;
  return (
    <div className="ed-block">
      <span className="ed-block-title">{item.data.title}</span>
      {item.data.note ? <span className="ed-block-note">{item.data.note}</span> : null}
    </div>
  );
}

const itemLabel = (item: Item<Placeholder>) =>
  `${item.kind === "round" ? "Branch" : item.kind === "frame" ? "Frame" : "Block"} ${item.data.title}`;

export default function CanvasDemo() {
  const store = useCanvasStore<Placeholder>({ items, kinds });
  // Fit once the surface has a size: the first measure happens in an effect of <Canvas>.
  useEffect(() => {
    const stop = store.subscribe(() => {
      if (store.getState().size.w) {
        stop();
        store.fitView({ padding: 48 });
      }
    });
    if (store.getState().size.w) {
      stop();
      store.fitView({ padding: 48 });
    }
    return stop;
  }, [store]);
  return (
    <Canvas
      store={store}
      label="Canvas demo"
      renderItem={renderItem}
      primitive={primitive}
      itemLabel={itemLabel}
      className="ed-canvas"
    >
      <ZoomControls history />
      <Minimap colorOf={(item) => (item.kind === "frame" ? "--line" : undefined)} />
    </Canvas>
  );
}
