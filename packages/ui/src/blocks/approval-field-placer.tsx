// Boxes placed on the pages of a DocumentViewer: signature, initials, date, text, checkbox. Each is
// given to a person (their colour and number), dragged, resized, nudged with the arrows and deleted.
// A panel lists them. From the keyboard, "Place on page" puts the chosen type on the page in view.

import { Cancel01Icon } from "@forgeron/icons";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
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
import {
  DocumentViewer,
  type DocumentPage,
  type DocumentViewerProps,
  type PageInfo,
} from "./approval-document-viewer";

export interface FieldPlacerProps {
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
  className?: string;
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
  className,
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

  const layer = (info: PageInfo) => (
    <div
      className={cx("fg-fp-layer", armed && "fg-fp-armed")}
      onPointerDown={(e) => {
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
      }}
    >
      {fieldsOfPage(fields, info.number).map((f) => {
        const kind = FIELD_KINDS[f.type];
        const idx = indexOf(f.participantId);
        const on = selected === f.id;
        return (
          <div
            key={f.id}
            className={cx("fg-fp-box", on && "fg-fp-on", f.required && "fg-fp-req")}
            style={{
              left: `${f.x * 100}%`,
              top: `${f.y * 100}%`,
              width: `${f.w * 100}%`,
              height: `${f.h * 100}%`,
              ["--fg-fp-tone" as string]: participantTone(idx),
            }}
            role="group"
            tabIndex={0}
            aria-label={`${kind.label} for ${nameOf(f.participantId)}${f.label ? `, ${f.label}` : ""}, page ${f.page}`}
            aria-description={
              readOnly
                ? undefined
                : "Arrow keys move it, Alt and arrows resize it, Delete removes it."
            }
            aria-current={on ? "true" : undefined}
            onFocus={(e) => {
              if (e.target === e.currentTarget) setSelected(f.id);
            }}
            onKeyDown={(e) => onKey(e, f)}
            onPointerDown={(e) => begin(e, f, "move")}
            onPointerMove={drag}
            onPointerUp={end}
            onPointerCancel={end}
          >
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
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={cx("fg-fp", className)}>
      <div className="fg-fp-stage">
        <DocumentViewer
          {...viewer}
          label={label}
          pages={pages}
          page={page}
          onPageChange={setPage}
          overlay={layer}
        />
      </div>
      <aside className="fg-fp-panel" aria-label={`${label}: fields`}>
        {readOnly ? null : (
          <div className="fg-fp-tools">
            <div className="fg-fp-types" role="group" aria-label="Type of box">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="fg-fp-type"
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
              ))}
            </div>
            <Select
              aria-label="Give new boxes to"
              value={assignee}
              onChange={(e) => setWho(e.target.value)}
              options={participants.map((p, i) => ({ value: p.id, label: `${i + 1}. ${p.name}` }))}
            />
            <p className="fg-fp-hint">
              {armed
                ? `Click the page to place a ${FIELD_KINDS[armed].label.toLowerCase()}. Shift keeps the tool.`
                : "Choose a type, then click the page."}
            </p>
            <Button size="sm" onClick={() => place(armed ?? type, page, 0.5, 0.5)}>
              Place on page {page}
            </Button>
          </div>
        )}
        {fields.length === 0 ? (
          <p className="fg-fp-empty">No box yet.</p>
        ) : (
          <ul className="fg-fp-list" aria-label="Boxes">
            {fields.map((f) => {
              const kind = FIELD_KINDS[f.type];
              const idx = indexOf(f.participantId);
              return (
                <li
                  key={f.id}
                  className={cx("fg-fp-item", selected === f.id && "fg-fp-itemon")}
                  style={{ ["--fg-fp-tone" as string]: participantTone(idx) }}
                >
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
                        onChange={(e) =>
                          update(f.id, (x) => ({ ...x, participantId: e.target.value }))
                        }
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
                </li>
              );
            })}
          </ul>
        )}
        <p className="fg-sr" role="status" aria-live="polite">
          {said}
        </p>
      </aside>
    </div>
  );
}
