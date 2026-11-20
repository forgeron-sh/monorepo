// The shapes, editor half: the three tools (R, O, D), the label typed in place, the far box, and
// the fill and stroke panel they share (the first plugin of the list that brings it counts).

import { DiamondIcon, EllipseIcon, Square01Icon, type IconDefinition } from "@forgeron/icons";
import { FillPicker, StrokePicker } from "@forgeron/ui";
import { colorCss, DRAW_PATTERNS } from "../../core/palette";
import type { DrawPlugin } from "../../core/plugin";
import { wash } from "../../core/svg";
import {
  diamond as diamondCore,
  ellipse as ellipseCore,
  rectangle as rectangleCore,
  shapeItem,
} from "../shapes";
import type { ShapeData, ShapeKind } from "../../core/types";
import { EditField } from "../../react/kit";
import {
  fromEditorFill,
  fromEditorStroke,
  toEditorFill,
  toEditorStroke,
} from "../../react/pickers";
import {
  defineEditorPlugin,
  type KindView,
  type PanelProps,
  type PanelSpec,
} from "../../react/plugin";
import { boxTool } from "./kit";

const PATTERNS = Object.keys(DRAW_PATTERNS);

/** The default size of a shape placed by a click. */
const CLICK_SIZE: Record<ShapeKind, { w: number; h: number }> = {
  rectangle: { w: 160, h: 100 },
  ellipse: { w: 120, h: 120 },
  diamond: { w: 140, h: 120 },
};

const shapeView: KindView = {
  overlay: (item) => !!(item.data as ShapeData).text,
  content(item, o) {
    const d = item.data as ShapeData;
    const edit = o.editing;
    return edit ? (
      <EditField {...edit} className="fgd-label fgd-field" label="Shape label" />
    ) : d.text ? (
      <div className="fgd-label">
        <span>{d.text}</span>
      </div>
    ) : null;
  },
  farStyle(item) {
    const d = item.data as ShapeData;
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
  },
  text: {
    type: (item, text) => ({ data: { ...(item.data as ShapeData), text } }),
  },
};

function ShapePanel({ style, edit, dataOf }: PanelProps) {
  const d = dataOf<ShapeData>("shape");
  const fill = d?.fill ?? style.fill;
  const stroke = d?.stroke ?? style.stroke;
  return (
    <>
      <FillPicker
        label="Fill"
        patterns={PATTERNS}
        value={toEditorFill(fill)}
        onChange={(f) => {
          const next = fromEditorFill(f);
          edit(
            "fill",
            (i) => (i.data.type === "shape" ? { data: { ...i.data, fill: next } } : null),
            { fill: next },
          );
        }}
      />
      <StrokePicker
        label="Stroke"
        fields={["color", "width", "dash"]}
        maxWidth={8}
        preview={false}
        value={toEditorStroke(stroke)}
        onChange={(s) => {
          const next = fromEditorStroke(s);
          edit(
            "stroke",
            (i) => (i.data.type === "shape" ? { data: { ...i.data, stroke: next } } : null),
            { stroke: next },
          );
        }}
      />
    </>
  );
}

export const shapePanel: PanelSpec = { id: "shape", type: "shape", Component: ShapePanel };

const shapePlugin = (
  core: DrawPlugin,
  kind: ShapeKind,
  label: string,
  shortcut: string,
  icon: IconDefinition,
) =>
  defineEditorPlugin({
    core,
    kinds: { [kind]: shapeView },
    panels: [shapePanel],
    tools: (ctx) => [
      boxTool(
        kind,
        label,
        shortcut,
        (b) => shapeItem(kind, b, { fill: ctx.style().fill, stroke: ctx.style().stroke }),
        CLICK_SIZE[kind],
        { dock: { icon, group: "shape" }, draws: "shape" },
      ),
    ],
  });

export const rectangle = shapePlugin(rectangleCore, "rectangle", "Rectangle", "r", Square01Icon);
export const ellipse = shapePlugin(ellipseCore, "ellipse", "Ellipse", "o", EllipseIcon);
export const diamond = shapePlugin(diamondCore, "diamond", "Diamond", "d", DiamondIcon);
