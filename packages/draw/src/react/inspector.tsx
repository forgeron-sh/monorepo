// The properties panel: the style of the selection (or of what the active tool will draw) with
// the pickers of @forgeron/ui, then the actions on the selection (order, group, lock, align,
// distribute, export). Every edit is one undo step; dragging a slider merges into one.

import type { ItemChange } from "@forgeron/canvas";
import { useCanvasState } from "@forgeron/canvas/react";
import {
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  BringToFrontIcon,
  ClipboardCopyIcon,
  Copy01Icon,
  Delete02Icon,
  DistributeHorizontalCenterIcon,
  DistributeVerticalCenterIcon,
  Download01Icon,
  FileDownloadIcon,
  GroupItemsIcon,
  LockIcon,
  LockOpenIcon,
  SendToBackIcon,
  UngroupItemsIcon,
} from "@forgeron/icons";
import {
  ColorPicker,
  FillPicker,
  IconButton,
  Input,
  Segmented,
  StrokePicker,
  Swatch,
  Tooltip,
  type EditorFill,
  type EditorStroke,
} from "@forgeron/ui";
import type { ReactNode } from "react";
import {
  align,
  distribute,
  group,
  newGroupId,
  toggleLock,
  ungroup,
  type AlignEdge,
} from "../core/arrange";
import type { DrawStyle } from "../core/create";
import type { DrawStore } from "../core/engine";
import {
  colorCss,
  DRAW_PATTERNS,
  fromPicker,
  pickerValue,
  STICKY_COLORS,
  STICKY_ORDER,
} from "../core/palette";
import { textHeight } from "../core/text";
import type { DrawData, DrawFill, DrawItem, DrawStroke } from "../core/types";

const PATTERNS = Object.keys(DRAW_PATTERNS);

export const toEditorFill = (f: DrawFill): EditorFill =>
  f.type === "none"
    ? { type: "none" }
    : f.type === "solid"
      ? {
          type: "solid",
          color: pickerValue(f.color) ?? "#ededed",
          ...(f.opacity !== undefined ? { opacity: f.opacity } : {}),
        }
      : {
          type: "pattern",
          pattern: f.pattern,
          color: pickerValue(f.color) ?? "#ededed",
          ...(f.opacity !== undefined ? { opacity: f.opacity } : {}),
        };

export const fromEditorFill = (f: EditorFill): DrawFill =>
  f.type === "none"
    ? { type: "none" }
    : f.type === "solid"
      ? {
          type: "solid",
          color: fromPicker(f.color),
          ...(f.opacity !== undefined && f.opacity < 1 ? { opacity: f.opacity } : {}),
        }
      : {
          type: "pattern",
          pattern: f.pattern,
          color: fromPicker(f.color),
          ...(f.opacity !== undefined && f.opacity < 1 ? { opacity: f.opacity } : {}),
        };

export const toEditorStroke = (s: DrawStroke): EditorStroke => ({
  color: pickerValue(s.color),
  width: s.width,
  dash: s.dash,
  cap: "butt",
  opacity: 1,
});

export const fromEditorStroke = (s: EditorStroke): DrawStroke => ({
  color: s.color ? fromPicker(s.color) : null,
  width: s.width,
  dash: s.dash,
});

const TEXT_SIZES = [
  { value: "16", label: "S" },
  { value: "20", label: "M" },
  { value: "28", label: "L" },
  { value: "40", label: "XL" },
];

const KIND_NAMES: Record<string, string> = {
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  diamond: "Diamond",
  sticky: "Sticky note",
  text: "Text",
  arrow: "Arrow",
  pen: "Pen stroke",
  frame: "Frame",
  image: "Image",
};

/** What the active tool draws, as the type of data it makes. */
const TOOL_TYPE: Record<string, DrawData["type"]> = {
  rectangle: "shape",
  ellipse: "shape",
  diamond: "shape",
  sticky: "sticky",
  text: "text",
  arrow: "arrow",
  pen: "pen",
};

export interface InspectorProps {
  store: DrawStore;
  style: DrawStyle;
  onStyle: (style: DrawStyle) => void;
  onExport: (format: "png" | "svg", ids: string[]) => void;
  onCopyJson: (ids: string[]) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fgd-insp-row" role="group" aria-label={title}>
      <span className="fgd-insp-name" aria-hidden="true">
        {title}
      </span>
      {children}
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: Parameters<typeof IconButton>[0]["icon"];
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip content={label}>
      <IconButton icon={icon} label={label} size="sm" onClick={onClick} disabled={disabled} />
    </Tooltip>
  );
}

export function Inspector({ store, style, onStyle, onExport, onCopyJson }: InspectorProps) {
  const items = useCanvasState(store, (s) => s.items) as ReadonlyArray<DrawItem>;
  const selection = useCanvasState(store, (s) => s.selection);
  const tool = useCanvasState(store, (s) => s.tool);
  const selected = selection.size ? items.filter((i) => selection.has(i.id)) : [];
  const ids = selected.map((i) => i.id);
  const types = new Set(selected.map((i) => i.data.type));
  const type: DrawData["type"] | undefined = selected.length
    ? types.size === 1
      ? selected[0]!.data.type
      : undefined
    : TOOL_TYPE[tool];
  if (!selected.length && !type) return null;

  const first = selected[0];
  const key = ids.join(",");
  /** Changes every selected item of a type, and the style of what comes next. */
  const edit = (
    field: string,
    change: (item: DrawItem) => ItemChange<DrawData> | null,
    next?: Partial<DrawStyle>,
  ) => {
    if (next) onStyle({ ...style, ...next });
    const changes: Array<readonly [string, ItemChange<DrawData>]> = [];
    for (const item of selected) {
      const c = change(item);
      if (c) changes.push([item.id, c]);
    }
    if (changes.length)
      store.updateMany(changes, { label: "Style", coalesce: `style:${field}:${key}` });
  };
  const dataOf = <T extends DrawData["type"]>(t: T) =>
    (first?.data.type === t ? first.data : undefined) as Extract<DrawData, { type: T }> | undefined;

  let body: ReactNode = null;
  switch (type) {
    case "shape": {
      const d = dataOf("shape");
      const fill = d?.fill ?? style.fill;
      const stroke = d?.stroke ?? style.stroke;
      body = (
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
      break;
    }
    case "sticky": {
      const current = dataOf("sticky")?.color ?? style.sticky;
      body = (
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
      break;
    }
    case "text": {
      const d = dataOf("text");
      body = (
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
                edit(
                  "color",
                  (i) => (i.data.type === "text" ? { data: { ...i.data, color } } : null),
                  { textColor: color },
                );
              }}
            />
          </Section>
        </>
      );
      break;
    }
    case "arrow": {
      const d = dataOf("arrow");
      body = (
        <>
          <Section title="Ends">
            <Segmented
              label="Arrowheads"
              value={d?.head ?? style.head}
              onChange={(v) => {
                const head = v as DrawStyle["head"];
                edit(
                  "head",
                  (i) => (i.data.type === "arrow" ? { data: { ...i.data, head } } : null),
                  { head },
                );
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
      break;
    }
    case "pen": {
      const d = dataOf("pen");
      body = (
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
      break;
    }
    case "frame": {
      const d = dataOf("frame");
      body =
        selected.length === 1 && d ? (
          <Section title="Name">
            <Input
              aria-label="Frame name"
              value={d.name}
              onChange={(e) => {
                const name = e.currentTarget.value;
                edit("name", (i) =>
                  i.data.type === "frame" ? { data: { ...i.data, name } } : null,
                );
              }}
            />
          </Section>
        ) : null;
      break;
    }
  }

  const many = selected.length >= 2;
  const allLocked = selected.length > 0 && selected.every((i) => i.locked);
  const grouped = selected.some((i) => i.data.group);
  const arrange = (label: string, changes: ReturnType<typeof align>) => {
    if (changes.length) store.updateMany(changes, { label });
  };
  const alignTo = (edge: AlignEdge, label: string) => arrange(label, align(selected, edge));

  return (
    <aside className="fgd-inspector" aria-label="Properties">
      <header className="fgd-insp-head t-mono">
        {selected.length === 0
          ? `New ${KIND_NAMES[tool]?.toLowerCase() ?? "item"}`
          : selected.length === 1
            ? (KIND_NAMES[first!.kind] ?? first!.kind)
            : "Selection"}
      </header>
      {body}
      {selected.length ? (
        <>
          <div className="fgd-insp-actions" role="toolbar" aria-label="Arrange">
            <Action
              icon={Copy01Icon}
              label="Duplicate"
              onClick={() => store.duplicateSelection()}
            />
            <Action
              icon={Delete02Icon}
              label="Delete"
              onClick={() => store.deleteSelection()}
              disabled={allLocked}
            />
            <Action
              icon={BringToFrontIcon}
              label="Bring to front"
              onClick={() => store.bringToFront()}
            />
            <Action icon={SendToBackIcon} label="Send to back" onClick={() => store.sendToBack()} />
            <Action
              icon={GroupItemsIcon}
              label="Group"
              disabled={!many}
              onClick={() => arrange("Group", group(selected, newGroupId(items as DrawItem[])))}
            />
            <Action
              icon={UngroupItemsIcon}
              label="Ungroup"
              disabled={!grouped}
              onClick={() => arrange("Ungroup", ungroup(selected))}
            />
            <Action
              icon={allLocked ? LockOpenIcon : LockIcon}
              label={allLocked ? "Unlock" : "Lock"}
              onClick={() => arrange(allLocked ? "Unlock" : "Lock", toggleLock(selected))}
            />
          </div>
          {many ? (
            <div className="fgd-insp-actions" role="toolbar" aria-label="Align">
              <Action
                icon={AlignLeftIcon}
                label="Align left"
                onClick={() => alignTo("left", "Align")}
              />
              <Action
                icon={AlignHorizontalCenterIcon}
                label="Align centres"
                onClick={() => alignTo("center", "Align")}
              />
              <Action
                icon={AlignRightIcon}
                label="Align right"
                onClick={() => alignTo("right", "Align")}
              />
              <Action
                icon={AlignTopIcon}
                label="Align top"
                onClick={() => alignTo("top", "Align")}
              />
              <Action
                icon={AlignVerticalCenterIcon}
                label="Align middles"
                onClick={() => alignTo("middle", "Align")}
              />
              <Action
                icon={AlignBottomIcon}
                label="Align bottom"
                onClick={() => alignTo("bottom", "Align")}
              />
              <Action
                icon={DistributeHorizontalCenterIcon}
                label="Distribute across"
                disabled={selected.length < 3}
                onClick={() => arrange("Distribute", distribute(selected, "horizontal"))}
              />
              <Action
                icon={DistributeVerticalCenterIcon}
                label="Distribute down"
                disabled={selected.length < 3}
                onClick={() => arrange("Distribute", distribute(selected, "vertical"))}
              />
            </div>
          ) : null}
          <div className="fgd-insp-actions" role="toolbar" aria-label="Export">
            <Action icon={Download01Icon} label="Export PNG" onClick={() => onExport("png", ids)} />
            <Action
              icon={FileDownloadIcon}
              label="Export SVG"
              onClick={() => onExport("svg", ids)}
            />
            <Action icon={ClipboardCopyIcon} label="Copy as JSON" onClick={() => onCopyJson(ids)} />
          </div>
        </>
      ) : null}
    </aside>
  );
}
