// The pixel pen, editor half: the pen tool (P), the live preview of the stroke while it is drawn,
// the far view as a line, and the colour and weight panel.

import type { Point } from "@forgeron/canvas";
import { WorldSvg } from "@forgeron/canvas/react";
import { PencilIcon } from "@forgeron/icons";
import { ColorPicker, Segmented } from "@forgeron/ui";
import { fromPicker, pickerValue, colorCss } from "../../core/palette";
import { pagePaint } from "../../core/svg";
import type { PenData } from "../../core/types";
import { frameClip, Section, toReact } from "../../react/kit";
import {
  defineEditorPlugin,
  type EditorContext,
  type KindView,
  type PanelProps,
} from "../../react/plugin";
import { useSignal } from "../../react/signal";
import { pen as penCore, penFromPoints } from "../pen";

const POINTS = "pen:points";

const penView: KindView = {
  farNode(item, o) {
    // Far out, a stroke is its line: its pixels would be smaller than a screen pixel.
    const d = item.data as PenData;
    const pts: string[] = [];
    for (let i = 0; i + 1 < d.points.length; i += 2)
      pts.push(`${d.points[i]! + 0.5},${d.points[i + 1]! + 0.5}`);
    return (
      <div className="fgd-item" data-type="pen" style={frameClip(item.bounds, o.frame)}>
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
  },
};

function PenPreview({ ctx }: { ctx: EditorContext }) {
  const pts = useSignal(ctx.signal<ReadonlyArray<Point> | null>(POINTS, null));
  if (!pts || pts.length === 0) return null;
  const s = ctx.style();
  const g = penFromPoints(pts, { color: s.penColor, weight: s.penWeight, epsilon: 0 });
  if (!g) return null;
  const nodes = ctx.registry
    .kind("pen")!
    .paint({ id: "pen-preview", kind: "pen", z: 0, ...g }, pagePaint("fgd-preview"));
  return <WorldSvg className="fgd-preview">{toReact(nodes)}</WorldSvg>;
}

function PenPanel({ style, onStyle, edit, dataOf, selected }: PanelProps) {
  const d = dataOf<PenData>("pen");
  return (
    <>
      <Section title="Colour">
        <ColorPicker
          label="Pen colour"
          clearable={false}
          value={pickerValue(d?.color ?? style.penColor)}
          onChange={(hex) => {
            if (!hex) return;
            const color = fromPicker(hex);
            edit(
              "pen-color",
              (i) => (i.data.type === "pen" ? { data: { ...i.data, color } } : null),
              { penColor: color },
            );
          }}
        />
      </Section>
      {selected.length === 0 ? (
        <Section title="Weight">
          <Segmented
            label="Pen weight"
            value={String(style.penWeight)}
            onChange={(v) => onStyle({ ...style, penWeight: Number(v) })}
            options={["1", "2", "3", "4"].map((w) => ({ value: w, label: `${w} px` }))}
          />
        </Section>
      ) : null}
    </>
  );
}

export const pen = defineEditorPlugin({
  core: penCore,
  kinds: { pen: penView },
  panels: [{ id: "pen", type: "pen", Component: PenPanel }],
  overlays: [{ id: "pen-preview", Component: PenPreview }],
  tools: (ctx) => [
    {
      id: "pen",
      label: "Pixel pen",
      shortcut: "p",
      cursor: "crosshair",
      dock: { icon: PencilIcon, group: "line" },
      draws: "pen",
      down(p, { store }) {
        const preview = ctx.signal<ReadonlyArray<Point> | null>(POINTS, null);
        const points: Point[] = [p.world];
        preview.set([...points]);
        return {
          move(q) {
            points.push(q.world);
            preview.set([...points]);
          },
          up(q) {
            points.push(q.world);
            preview.set(null);
            const style = ctx.style();
            const g = penFromPoints(points, { color: style.penColor, weight: style.penWeight });
            if (g) store.add({ kind: "pen", ...g }, { label: "Draw" });
          },
          cancel: () => preview.set(null),
        };
      },
    },
  ],
});
