// The notes, editor half: the sticky note (S) and the text (T) typed in place, a double click on the
// empty board that starts a text, and their panels.

import { StickyNote01Icon, TextIcon } from "@forgeron/icons";
import { ColorPicker, Segmented, Swatch } from "@forgeron/ui";
import type { CSSProperties } from "react";
import { colorCss, fromPicker, pickerValue, STICKY_COLORS, STICKY_ORDER } from "../../core/palette";
import { wash } from "../../core/svg";
import { STICKY_PADDING, STICKY_TEXT, stickyHeight, textHeight, textWidth } from "../../core/text";
import type { StickyData, TextData } from "../../core/types";
import type { DrawStyle } from "../../core/style";
import { EditField, Section } from "../../react/kit";
import { defineEditorPlugin, type KindView, type PanelProps } from "../../react/plugin";
import {
  STICKY_SIZE,
  stickyItem,
  sticky as stickyCore,
  text as textCore,
  textItem,
} from "../notes";

const stickyView: KindView = {
  overlay: (item) => (item.data as StickyData).text !== "",
  content(item, o) {
    const d = item.data as StickyData;
    return o.editing ? (
      <EditField {...o.editing} className="fgd-sticky-text fgd-field" label="Sticky note text" />
    ) : (
      <div className="fgd-sticky-text">{d.text}</div>
    );
  },
  style: () =>
    ({ "--fgd-pad": `${STICKY_PADDING}px`, "--fgd-size": `${STICKY_TEXT}px` }) as CSSProperties,
  farStyle(item) {
    const d = item.data as StickyData;
    const c = STICKY_COLORS[d.color] ?? STICKY_COLORS.amber;
    return { background: colorCss(c.paper), borderTop: `4px solid ${colorCss(c.edge)}` };
  },
  text: {
    type(item, text, measured) {
      const d = item.data as StickyData;
      const b = item.bounds;
      const h = Math.max(b.w, measured ?? stickyHeight(text, b.w));
      return { data: { ...d, text }, bounds: { ...b, h: Math.max(stickyHeight("", b.w), h) } };
    },
    discard: (item, cancel) => cancel && !(item.data as StickyData).text,
  },
};

const textView: KindView = {
  overlay: (item) => (item.data as TextData).text !== "",
  content(item, o) {
    const d = item.data as TextData;
    const style = { fontSize: d.size, color: colorCss(d.color), textAlign: d.align } as const;
    return o.editing ? (
      <EditField {...o.editing} className="fgd-text fgd-field" style={style} label="Text" />
    ) : (
      <div className="fgd-text" style={style}>
        {d.text}
      </div>
    );
  },
  farStyle(item) {
    const d = item.data as TextData;
    return d.text ? { background: wash(colorCss(d.color), 0.25) } : null;
  },
  text: {
    type(item, text, measured, grow) {
      const d = item.data as TextData;
      const b = item.bounds;
      const w = grow ? Math.min(640, Math.max(d.size * 4, textWidth(text, d.size) + 8)) : b.w;
      const h = Math.max(measured ?? 0, textHeight(text || " ", w, d.size));
      return { data: { ...d, text }, bounds: { ...b, w, h } };
    },
    discard: (item) => !(item.data as TextData).text.trim(),
  },
};

const TEXT_SIZES = [
  { value: "16", label: "S" },
  { value: "20", label: "M" },
  { value: "28", label: "L" },
  { value: "40", label: "XL" },
];

function StickyPanel({ style, edit, dataOf }: PanelProps) {
  const current = dataOf<StickyData>("sticky")?.color ?? style.sticky;
  return (
    <Section title="Colour">
      <Segmented
        label="Sticky note colour"
        iconOnly
        value={current}
        onChange={(v) => {
          const color = v as DrawStyle["sticky"];
          edit(
            "sticky",
            (i) => (i.data.type === "sticky" ? { data: { ...i.data, color } } : null),
            { sticky: color },
          );
        }}
        options={STICKY_ORDER.map((c) => ({
          value: c,
          label: <Swatch color={colorCss(STICKY_COLORS[c].edge)} />,
          ariaLabel: STICKY_COLORS[c].label,
        }))}
      />
    </Section>
  );
}

function TextPanel({ style, edit, dataOf }: PanelProps) {
  const d = dataOf<TextData>("text");
  return (
    <>
      <Section title="Size">
        <Segmented
          label="Text size"
          value={String(d?.size ?? style.textSize)}
          onChange={(v) => {
            const size = Number(v);
            edit(
              "size",
              (i) =>
                i.data.type === "text"
                  ? {
                      data: { ...i.data, size },
                      bounds: {
                        ...i.bounds,
                        h: textHeight(i.data.text || " ", i.bounds.w, size),
                      },
                    }
                  : null,
              { textSize: size },
            );
          }}
          options={TEXT_SIZES}
        />
      </Section>
      <Section title="Align">
        <Segmented
          label="Text alignment"
          value={d?.align ?? "left"}
          onChange={(v) => {
            const a = v as "left" | "center" | "right";
            edit("align", (i) =>
              i.data.type === "text" ? { data: { ...i.data, align: a } } : null,
            );
          }}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Centre" },
            { value: "right", label: "Right" },
          ]}
        />
      </Section>
      <Section title="Colour">
        <ColorPicker
          label="Text colour"
          clearable={false}
          value={pickerValue(d?.color ?? style.textColor)}
          onChange={(hex) => {
            if (!hex) return;
            const color = fromPicker(hex);
            edit("color", (i) => (i.data.type === "text" ? { data: { ...i.data, color } } : null), {
              textColor: color,
            });
          }}
        />
      </Section>
    </>
  );
}

export const sticky = defineEditorPlugin({
  core: stickyCore,
  kinds: { sticky: stickyView },
  panels: [{ id: "sticky", type: "sticky", Component: StickyPanel }],
  tools: (ctx) => [
    {
      id: "sticky",
      label: "Sticky note",
      shortcut: "s",
      cursor: "crosshair",
      dock: { icon: StickyNote01Icon, group: "note" },
      draws: "sticky",
      down(p, { store, snap }) {
        return {
          up() {
            const at = snap({ x: p.world.x - STICKY_SIZE / 2, y: p.world.y - STICKY_SIZE / 2 }, p);
            const key = ctx.editKey();
            const [item] = store.add(stickyItem(at, "", ctx.style().sticky), {
              label: "Add sticky note",
              coalesce: key,
            });
            store.setTool("select");
            if (item) {
              store.select([item.id]);
              ctx.edit(item.id, key, false);
            }
          },
        };
      },
    },
  ],
});

export const text = defineEditorPlugin({
  core: textCore,
  kinds: { text: textView },
  panels: [{ id: "text", type: "text", Component: TextPanel }],
  tools: (ctx) => [
    {
      id: "text",
      label: "Text",
      shortcut: "t",
      cursor: "text",
      dock: { icon: TextIcon, group: "note" },
      draws: "text",
      down(p, { store, snap }) {
        return {
          up() {
            const style = ctx.style();
            const at = snap({ x: p.world.x, y: p.world.y - style.textSize * 0.7 }, { alt: true });
            const key = ctx.editKey();
            const [item] = store.add(textItem(at, "", style.textSize, style.textColor), {
              label: "Add text",
              coalesce: key,
            });
            store.setTool("select");
            if (item) {
              store.select([item.id]);
              ctx.edit(item.id, key, true);
            }
          },
        };
      },
    },
  ],
  // A double click on the empty board starts a text there.
  surface: {
    doubleClick(ctx, point) {
      const key = ctx.editKey();
      const s = ctx.style();
      const [item] = ctx.store.add(
        {
          kind: "text",
          bounds: {
            x: point.x,
            y: point.y - s.textSize * 0.7,
            w: s.textSize * 4,
            h: textHeight(" ", 80, s.textSize),
          },
          data: { type: "text", text: "", size: s.textSize, color: s.textColor, align: "left" },
        },
        { label: "Add text", coalesce: key },
      );
      if (item) {
        ctx.store.select([item.id]);
        ctx.edit(item.id, key, true);
      }
      return true;
    },
  },
});
