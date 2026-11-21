// Boxes placed on the pages of a DocumentViewer: signature, initials, date, text, checkbox. Each is
// given to a person (their colour and number), dragged, resized, nudged with the arrows and deleted.
// A panel lists them. From the keyboard, "Place on page" puts the chosen type on the page in view.
//
// With `pages` and `participants` it is the usual placer. With children it is a frame, and the
// parts compose it:
//
//   <FieldPlacer label="Contract" pages={pages} participants={people} value={fields} onChange={set}>
//     <FieldPlacerStage />
//     <FieldPlacerPanel>
//       <FieldPlacerTools><FieldPlacerTypes /><FieldPlacerAssignee /><FieldPlacerHint /><FieldPlacerPlace /></FieldPlacerTools>
//       <FieldPlacerList /><FieldPlacerLive />
//     </FieldPlacerPanel>
//   </FieldPlacer>

import { Cancel01Icon } from "@forgeron/icons";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { createContext, Fragment, useContext, useRef, useState } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Select } from "../select";
import {
  boxAt,
  FIELD_KINDS,
  PLACED_FIELD_TYPES,
  fieldsOfPage,
  nextId,
  nudgeField,
  participantTone,
  resizeField,
  type ApprovalParticipant,
  type PlacedFieldType,
  type PlacedField,
} from "./approval-model";
import { part, type PartProps } from "../part";
import {
  DocumentViewer,
  type DocumentPage,
  type DocumentViewerProps,
  type PageInfo,
} from "./approval-document-viewer";

export interface FieldPlacerProps extends Omit<
  PartProps<"div">,
  "children" | "onChange" | "defaultValue"
> {
  /** Names the placer: "Fields of the contract". */
  label: string;
  pages: ReadonlyArray<DocumentPage>;
  /** Who the boxes can be given to; each gets a colour and a number. */
  participants: ReadonlyArray<ApprovalParticipant>;
  value?: ReadonlyArray<PlacedField>;
  defaultValue?: ReadonlyArray<PlacedField>;
  onChange?: (fields: PlacedField[]) => void;
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** Which types can be placed. All five by default. */
  types?: ReadonlyArray<PlacedFieldType>;
  /** Only look: no placing, moving or deleting. */
  readOnly?: boolean;
  /** Passed to the viewer: `height`, `thumbnails`, `onSearch`, `zoom`… */
  viewer?: Partial<
    Omit<DocumentViewerProps, "label" | "pages" | "overlay" | "page" | "onPageChange">
  >;
  /** The parts (`FieldPlacerStage`, `FieldPlacerPanel`). Without them, the placer is built from the props. */
  children?: ReactNode;
}

interface Gesture {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  rect: DOMRect;
  origin: PlacedField;
}

const STEP = 0.005;
const BIG = 0.02;

interface PlacerContext {
  label: string;
  pages: ReadonlyArray<DocumentPage>;
  participants: ReadonlyArray<ApprovalParticipant>;
  fields: ReadonlyArray<PlacedField>;
  selected: string | null;
  setSelected: (id: string | null) => void;
  types: ReadonlyArray<PlacedFieldType>;
  readOnly: boolean;
  viewer: FieldPlacerProps["viewer"];
  page: number;
  setPage: (page: number) => void;
  armed: PlacedFieldType | null;
  setArmed: (type: PlacedFieldType | null) => void;
  type: PlacedFieldType;
  setType: (type: PlacedFieldType) => void;
  assignee: string;
  setWho: (id: string) => void;
  said: string;
  indexOf: (id: string) => number;
  nameOf: (id: string) => string;
  place: (type: PlacedFieldType, page: number, x: number, y: number) => void;
  update: (id: string, fn: (f: PlacedField) => PlacedField) => void;
  remove: (id: string) => void;
  onKey: (event: KeyboardEvent<HTMLDivElement>, f: PlacedField) => void;
  begin: (event: ReactPointerEvent<HTMLElement>, f: PlacedField, mode: "move" | "resize") => void;
  drag: (event: ReactPointerEvent<HTMLElement>) => void;
  end: () => void;
}
const PlacerCtx = createContext<PlacerContext | null>(null);

function usePlacer(name: string): PlacerContext {
  const ctx = useContext(PlacerCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <FieldPlacer>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** One box on a page: moved, resized and deleted with the pointer or the keys. */
export function FieldPlacerBox({
  field: f,
  ...rest
}: Omit<PartProps<"div">, "children"> & { field: PlacedField }) {
  const { selected, setSelected, readOnly, indexOf, nameOf, onKey, begin, drag, end } =
    usePlacer("FieldPlacerBox");
  const kind = FIELD_KINDS[f.type];
  const idx = indexOf(f.participantId);
  const on = selected === f.id;
  return part(
    "div",
    "field-placer-box",
    cx("fg-fp-box", on && "fg-fp-on", f.required && "fg-fp-req"),
    {
      ...rest,
      children: (
        <>
          <span className="fg-fp-tag">
            <Icon icon={kind.icon} size={12} variant="mono" />
            <b>{idx + 1}</b>
            <span className="fg-fp-tagtext">{f.label ?? kind.label}</span>
          </span>
          {on && !readOnly ? (
            <span
              className="fg-fp-handle"
              aria-hidden="true"
              onPointerDown={(e) => begin(e, f, "resize")}
              onPointerMove={drag}
              onPointerUp={end}
              onPointerCancel={end}
            />
          ) : null}
        </>
      ),
    },
    {
      "data-field": f.id,
      style: {
        left: `${f.x * 100}%`,
        top: `${f.y * 100}%`,
        width: `${f.w * 100}%`,
        height: `${f.h * 100}%`,
        ["--fg-fp-tone" as string]: participantTone(idx),
      },
      role: "group",
      tabIndex: 0,
      "aria-label": `${kind.label} for ${nameOf(f.participantId)}${f.label ? `, ${f.label}` : ""}, page ${f.page}`,
      "aria-description": readOnly
        ? undefined
        : "Arrow keys move it, Alt and arrows resize it, Delete removes it.",
      "aria-current": on ? "true" : undefined,
      onFocus: (e: { target: unknown; currentTarget: unknown }) => {
        if (e.target === e.currentTarget) setSelected(f.id);
      },
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => onKey(e, f),
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => begin(e, f, "move"),
      onPointerMove: drag,
      onPointerUp: end,
      onPointerCancel: end,
    },
  );
}

/** What is drawn over one page: its boxes; a click places the armed type, or clears the selection. */
export function FieldPlacerLayer({
  info,
  children,
  ...rest
}: Omit<PartProps<"div">, "children"> & { info: PageInfo; children?: ReactNode }) {
  const { armed, setArmed, readOnly, place, setSelected, fields } = usePlacer("FieldPlacerLayer");
  return part(
    "div",
    "field-placer-layer",
    cx("fg-fp-layer", armed && "fg-fp-armed"),
    {
      ...rest,
      children:
        children ??
        fieldsOfPage(fields, info.number).map((f) => <FieldPlacerBox key={f.id} field={f} />),
    },
    {
      onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        if (armed && !readOnly) {
          const rect = e.currentTarget.getBoundingClientRect();
          place(
            armed,
            info.number,
            (e.clientX - rect.left) / (rect.width || 1),
            (e.clientY - rect.top) / (rect.height || 1),
          );
          if (!e.shiftKey) setArmed(null);
        } else setSelected(null);
      },
    },
  );
}

/** The document, with the layer of boxes over each page. */
export function FieldPlacerStage({ children, ...rest }: PartProps<"div">) {
  const { label, pages, page, setPage, viewer } = usePlacer("FieldPlacerStage");
  return part("div", "field-placer-stage", "fg-fp-stage", {
    ...rest,
    children: children ?? (
      <DocumentViewer
        {...viewer}
        label={label}
        pages={pages}
        page={page}
        onPageChange={setPage}
        overlay={(info) => <FieldPlacerLayer info={info} />}
      />
    ),
  });
}

/** The types of box, to press and then click the page. */
export function FieldPlacerTypes(props: PartProps<"div">) {
  const { types, armed, setArmed, type, setType } = usePlacer("FieldPlacerTypes");
  return part(
    "div",
    "field-placer-types",
    "fg-fp-types",
    {
      ...props,
      children:
        props.children ??
        types.map((t) => (
          <button
            key={t}
            type="button"
            className="fg-fp-type"
            data-slot="field-placer-type"
            aria-pressed={armed === t}
            data-chosen={type === t ? "" : undefined}
            onClick={() => {
              setType(t);
              setArmed(armed === t ? null : t);
            }}
          >
            <Icon icon={FIELD_KINDS[t].icon} size={12} variant="mono" />
            {FIELD_KINDS[t].label}
          </button>
        )),
    },
    { role: "group", "aria-label": "Type of box" },
  );
}

/** Who new boxes are given to. */
export function FieldPlacerAssignee() {
  const { participants, assignee, setWho } = usePlacer("FieldPlacerAssignee");
  return (
    <Select
      data-slot="field-placer-assignee"
      aria-label="Give new boxes to"
      value={assignee}
      onChange={(e) => setWho(e.target.value)}
      options={participants.map((p, i) => ({ value: p.id, label: `${i + 1}. ${p.name}` }))}
    />
  );
}

/** What to do next. */
export function FieldPlacerHint({ children, ...rest }: PartProps<"p">) {
  const { armed } = usePlacer("FieldPlacerHint");
  return part("p", "field-placer-hint", "fg-fp-hint", {
    ...rest,
    children:
      children ??
      (armed
        ? `Click the page to place a ${FIELD_KINDS[armed].label.toLowerCase()}. Shift keeps the tool.`
        : "Choose a type, then click the page."),
  });
}

/** "Place on page 2": puts the chosen type in the middle of the page in view, for the keyboard. */
export function FieldPlacerPlace({ children }: { children?: ReactNode }) {
  const { place, armed, type, page } = usePlacer("FieldPlacerPlace");
  return (
    <Button
      data-slot="field-placer-place"
      size="sm"
      onClick={() => place(armed ?? type, page, 0.5, 0.5)}
    >
      {children ?? `Place on page ${page}`}
    </Button>
  );
}

/** The tools: types, assignee, hint and the place button; not shown when read only. */
export function FieldPlacerTools({ children, ...rest }: PartProps<"div">) {
  const { readOnly } = usePlacer("FieldPlacerTools");
  if (readOnly) return null;
  return part("div", "field-placer-tools", "fg-fp-tools", {
    ...rest,
    children: children ?? (
      <>
        <FieldPlacerTypes />
        <FieldPlacerAssignee />
        <FieldPlacerHint />
        <FieldPlacerPlace />
      </>
    ),
  });
}

/** One box in the list: press it to select it and go to its page. */
export function FieldPlacerItem({
  field: f,
  ...rest
}: Omit<PartProps<"li">, "children"> & { field: PlacedField }) {
  const {
    selected,
    setSelected,
    setPage,
    readOnly,
    indexOf,
    nameOf,
    participants,
    update,
    remove,
  } = usePlacer("FieldPlacerItem");
  const kind = FIELD_KINDS[f.type];
  const idx = indexOf(f.participantId);
  return part(
    "li",
    "field-placer-item",
    cx("fg-fp-item", selected === f.id && "fg-fp-itemon"),
    {
      ...rest,
      children: (
        <>
          <button
            type="button"
            className="fg-fp-pick"
            aria-pressed={selected === f.id}
            onClick={() => {
              setSelected(f.id);
              setPage(f.page);
            }}
          >
            <i className="fg-fp-swatch" aria-hidden="true" />
            <Icon icon={kind.icon} size={12} variant="mono" />
            <span className="fg-fp-iname">{f.label ?? kind.label}</span>
            <span className="fg-fp-imeta">
              {nameOf(f.participantId)} · p. {f.page}
            </span>
          </button>
          {readOnly ? null : (
            <>
              <Select
                aria-label={`Give ${kind.label} to`}
                value={f.participantId}
                onChange={(e) => update(f.id, (x) => ({ ...x, participantId: e.target.value }))}
                options={participants.map((p, i) => ({
                  value: p.id,
                  label: `${i + 1}. ${p.name}`,
                }))}
              />
              <IconButton
                icon={Cancel01Icon}
                size="sm"
                label={`Delete ${kind.label} on page ${f.page}`}
                onClick={() => remove(f.id)}
              />
            </>
          )}
        </>
      ),
    },
    { style: { ["--fg-fp-tone" as string]: participantTone(idx) } },
  );
}

/** The list of boxes, or "No box yet."; `renderItem` draws an entry your way. */
export function FieldPlacerList({
  renderItem,
  ...rest
}: Omit<PartProps<"ul">, "children"> & { renderItem?: (field: PlacedField) => ReactNode }) {
  const { fields } = usePlacer("FieldPlacerList");
  if (fields.length === 0) return <p className="fg-fp-empty">No box yet.</p>;
  return part(
    "ul",
    "field-placer-list",
    "fg-fp-list",
    {
      ...rest,
      children: fields.map((f) => (
        <Fragment key={f.id}>{renderItem ? renderItem(f) : <FieldPlacerItem field={f} />}</Fragment>
      )),
    },
    { "aria-label": "Boxes" },
  );
}

/** The polite line that says every change. */
export function FieldPlacerLive(props: PartProps<"p">) {
  const { said } = usePlacer("FieldPlacerLive");
  return part(
    "p",
    "field-placer-live",
    "fg-sr",
    { ...props, children: props.children ?? said },
    { role: "status", "aria-live": "polite" },
  );
}

/** The panel beside the document: the tools, the list of boxes. */
export function FieldPlacerPanel({ children, ...rest }: PartProps<"aside">) {
  const { label } = usePlacer("FieldPlacerPanel");
  return part(
    "aside",
    "field-placer-panel",
    "fg-fp-panel",
    {
      ...rest,
      children: children ?? (
        <>
          <FieldPlacerTools />
          <FieldPlacerList />
          <FieldPlacerLive />
        </>
      ),
    },
    { "aria-label": `${label}: fields` },
  );
}

/* ---------------------------------------------------------------- the placer */

/** Place, drag, resize and delete typed boxes on a document's pages, each for a participant. */
export function FieldPlacer({
  label,
  pages,
  participants,
  value,
  defaultValue = [],
  onChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  types = PLACED_FIELD_TYPES,
  readOnly = false,
  viewer,
  children,
  className,
  asChild,
  ...rest
}: FieldPlacerProps) {
  const [fields, setFields] = useControllableState<ReadonlyArray<PlacedField>>({
    value,
    defaultValue,
    onChange: (next) => onChange?.([...next]),
  });
  const [selected, setSelected] = useControllableState<string | null>({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
  });
  const [page, setPage] = useState(1);
  const [armed, setArmed] = useState<PlacedFieldType | null>(null);
  const [type, setType] = useState<PlacedFieldType>(types[0] ?? "signature");
  const [who, setWho] = useState(participants[0]?.id ?? "");
  const [said, setSaid] = useState("");
  const gesture = useRef<Gesture | null>(null);

  const indexOf = (id: string) =>
    Math.max(
      participants.findIndex((p) => p.id === id),
      0,
    );
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? "Nobody";
  const assignee = participants.some((p) => p.id === who) ? who : (participants[0]?.id ?? "");

  const place = (fieldType: PlacedFieldType, pageNo: number, cx0: number, cy0: number) => {
    if (readOnly || !assignee) return;
    const target = pages[pageNo - 1];
    const aspect = target ? target.height / target.width : 1.414;
    const field: PlacedField = {
      id: nextId(
        fields.map((f) => f.id),
        "field",
      ),
      type: fieldType,
      page: pageNo,
      ...boxAt(fieldType, cx0, cy0, aspect),
      participantId: assignee,
    };
    setFields([...fields, field]);
    setSelected(field.id);
    setSaid(`${FIELD_KINDS[fieldType].label} placed on page ${pageNo} for ${nameOf(assignee)}.`);
  };

  const update = (id: string, fn: (f: PlacedField) => PlacedField) =>
    setFields(fields.map((f) => (f.id === id ? fn(f) : f)));

  const remove = (id: string) => {
    const f = fields.find((x) => x.id === id);
    setFields(fields.filter((x) => x.id !== id));
    if (selected === id) setSelected(null);
    if (f) setSaid(`${FIELD_KINDS[f.type].label} deleted.`);
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>, f: PlacedField) => {
    if (readOnly || event.target !== event.currentTarget) return;
    const { key } = event;
    const step = event.shiftKey ? BIG : STEP;
    const dx = key === "ArrowRight" ? step : key === "ArrowLeft" ? -step : 0;
    const dy = key === "ArrowDown" ? step : key === "ArrowUp" ? -step : 0;
    if (dx || dy) {
      event.preventDefault();
      event.stopPropagation();
      update(f.id, (x) => (event.altKey ? resizeField(x, dx, dy) : nudgeField(x, dx, dy)));
    } else if (key === "Delete" || key === "Backspace") {
      event.preventDefault();
      remove(f.id);
    } else if (key === "Escape") {
      setSelected(null);
    }
  };

  const begin = (
    event: ReactPointerEvent<HTMLElement>,
    f: PlacedField,
    mode: "move" | "resize",
  ) => {
    if (readOnly || event.button > 0) return;
    const layer = event.currentTarget.closest<HTMLElement>(".fg-fp-layer");
    if (!layer) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current = {
      id: f.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      rect: layer.getBoundingClientRect(),
      origin: f,
    };
    setSelected(f.id);
  };
  const drag = (event: ReactPointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = (event.clientX - g.startX) / (g.rect.width || 1);
    const dy = (event.clientY - g.startY) / (g.rect.height || 1);
    update(g.id, () =>
      g.mode === "move" ? nudgeField(g.origin, dx, dy) : resizeField(g.origin, dx, dy),
    );
  };
  const end = () => {
    gesture.current = null;
  };

  return (
    <PlacerCtx.Provider
      value={{
        label,
        pages,
        participants,
        fields,
        selected,
        setSelected,
        types,
        readOnly,
        viewer,
        page,
        setPage,
        armed,
        setArmed,
        type,
        setType,
        assignee,
        setWho,
        said,
        indexOf,
        nameOf,
        place,
        update,
        remove,
        onKey,
        begin,
        drag,
        end,
      }}
    >
      {part("div", "field-placer", "fg-fp", {
        className,
        asChild,
        ...rest,
        children: children ?? (
          <>
            <FieldPlacerStage />
            <FieldPlacerPanel />
          </>
        ),
      })}
    </PlacerCtx.Provider>
  );
}
