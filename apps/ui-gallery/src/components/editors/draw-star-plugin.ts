import { definePlugin, pagePaint, svgNode, type DrawItem, type KindSpec } from "@forgeron/draw";
import { defineEditorPlugin } from "@forgeron/draw/plugins/editor";
import { StarAward02Icon } from "@forgeron/icons";

// A plugin the gallery defines itself: a star, in one file, with no help from the package beyond its
// public contract. The core half says what a star is in the board (its JSON, its hit test, its SVG);
// the editor half is the tool (key X) that draws one.

interface StarData {
  type: "star";
  points: number;
}

const polygon = (item: DrawItem, color: string) => {
  const b = item.bounds;
  const k = (item.data as unknown as StarData).points;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const r = Math.min(b.w, b.h) / 2;
  const points = Array.from({ length: k * 2 }, (_, i) => {
    const radius = i % 2 ? r * 0.42 : r;
    const a = (Math.PI * i) / k - Math.PI / 2;
    return `${(cx + Math.cos(a) * radius).toFixed(1)},${(cy + Math.sin(a) * radius).toFixed(1)}`;
  }).join(" ");
  return svgNode("polygon", { points, fill: color, stroke: "none" });
};

const starKind: KindSpec = {
  type: "star",
  label: "Star",
  canvas: {
    resize: { keepAspect: true, minW: 24, minH: 24 },
    hitTest: (i, p) =>
      Math.hypot(p.x - i.bounds.x - i.bounds.w / 2, p.y - i.bounds.y - i.bounds.h / 2) <=
      Math.min(i.bounds.w, i.bounds.h) / 2,
  },
  parse: (raw) =>
    ({ type: "star", points: typeof raw.points === "number" ? raw.points : 5 }) as never,
  paint: (item, o) => [polygon(item, o.color("warning"))],
  far: (item) => [{ type: "ellipse", ...item.bounds, fill: pagePaint("far").color("warning") }],
};

const starCore = definePlugin({
  id: "star",
  name: "Star",
  description: "A star with a number of points.",
  kinds: { star: starKind },
});

export const star = defineEditorPlugin({
  core: starCore,
  tools: () => [
    {
      id: "star",
      label: "Star",
      shortcut: "x",
      cursor: "crosshair",
      dock: { icon: StarAward02Icon, group: "star" },
      down(p, { store, snap }) {
        return {
          up() {
            const at = snap({ x: p.world.x - 48, y: p.world.y - 48 }, p);
            const [item] = store.add(
              {
                kind: "star",
                bounds: { x: at.x, y: at.y, w: 96, h: 96 },
                data: { type: "star", points: 5 } as never,
              },
              { label: "Add star" },
            );
            store.setTool("select");
            if (item) store.select([item.id]);
          },
        };
      },
    },
  ],
});
