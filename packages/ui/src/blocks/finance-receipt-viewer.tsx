// A scanned receipt or invoice with what was read from it: the page (an image of it, a PDF page
// drawn by the caller) under boxes over each recognised field, and a list of those fields beside
// it. Hovering or focusing a box lights its row and the other way round; a row can be corrected.

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Edit04Icon,
  Tick02Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@forgeron/icons";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { clampFieldBox, confidenceLevel, type FieldBox } from "./finance-model";

export interface ReceiptPage {
  /** An image URL: a photo, or a PDF page rendered by the caller. */
  src: string;
  alt?: string;
  /** Width over height; used until the image has loaded. Default 0.7. */
  aspect?: number;
}

export interface ReceiptField {
  id: string;
  /** `Merchant`, `Date`, `Total`. */
  label: string;
  value: string;
  /** From 0 to 1. Unknown when absent. */
  confidence?: number;
  /** Where it was read, as fractions of the page. A field without a box is only listed. */
  box?: FieldBox;
  /** Index into `pages`. Default 0. */
  page?: number;
  /** The value was checked or corrected by a person. */
  verified?: boolean;
}

export interface ReceiptViewerProps {
  /** Names the viewer. Default "Receipt". */
  label?: string;
  pages: ReadonlyArray<ReceiptPage>;
  fields: ReadonlyArray<ReceiptField>;
  /** Turns correction on: hears `(fieldId, value)` when a row is saved. */
  onFieldChange?: (id: string, value: string) => void;
  /** The field selected. Controlled or not. */
  active?: string | null;
  defaultActive?: string | null;
  onActiveChange?: (id: string | null) => void;
  /** Starting zoom, 1 fits the width. */
  defaultZoom?: number;
  className?: string;
}

const LEVEL_WORD = { high: "High", medium: "Medium", low: "Low", none: "Unknown" } as const;

/** The page, the boxes and the list of fields, linked both ways. */
export function ReceiptViewer({
  label = "Receipt",
  pages,
  fields,
  onFieldChange,
  active,
  defaultActive = null,
  onActiveChange,
  defaultZoom = 1,
  className,
}: ReceiptViewerProps) {
  const [current, setCurrent] = useControllableState<string | null>({
    value: active,
    defaultValue: defaultActive,
    onChange: onActiveChange,
  });
  const [hover, setHover] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(defaultZoom);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [ratio, setRatio] = useState<Record<number, number>>({});
  const list = useRef<HTMLUListElement>(null);
  const editable = !!onFieldChange;
  const shown = pages[page];
  const aspect = ratio[page] ?? shown?.aspect ?? 0.7;
  const lit = hover ?? current;

  useEffect(() => {
    if (editing) list.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [editing]);

  const select = (field: ReceiptField) => {
    setCurrent(field.id);
    if (field.box && (field.page ?? 0) !== page) setPage(field.page ?? 0);
  };
  const startEdit = (field: ReceiptField) => {
    select(field);
    setDraft(field.value);
    setEditing(field.id);
  };
  const save = (field: ReceiptField) => {
    if (draft !== field.value) onFieldChange?.(field.id, draft);
    setEditing(null);
    list.current?.querySelector<HTMLElement>(`[data-field="${field.id}"]`)?.focus();
  };
  const onRowKey = (event: KeyboardEvent<HTMLElement>, field: ReceiptField) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const rows = [...(list.current?.querySelectorAll<HTMLElement>("[data-field]") ?? [])];
      const at = rows.indexOf(event.currentTarget);
      rows[
        Math.max(0, Math.min(rows.length - 1, at + (event.key === "ArrowDown" ? 1 : -1)))
      ]?.focus();
    } else if ((event.key === "Enter" || event.key === "F2") && editable) {
      event.preventDefault();
      startEdit(field);
    } else if (event.key === "Escape") setCurrent(null);
  };

  const boxes = fields.filter((f) => f.box && (f.page ?? 0) === page);
  return (
    <div className={cx("fg-fin-rv", className)} role="group" aria-label={label}>
      <div className="fg-fin-rv-stage">
        <div className="fg-fin-rv-bar">
          {pages.length > 1 ? (
            <>
              <IconButton
                icon={ArrowUp01Icon}
                label="Previous page"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              />
              <span className="fg-fin-rv-count" aria-live="polite">
                Page {page + 1} of {pages.length}
              </span>
              <IconButton
                icon={ArrowDown01Icon}
                label="Next page"
                size="sm"
                disabled={page === pages.length - 1}
                onClick={() => setPage(page + 1)}
              />
            </>
          ) : null}
          <span className="fg-fin-rv-gap" />
          <IconButton
            icon={ZoomOutIcon}
            label="Zoom out"
            size="sm"
            disabled={zoom <= 0.5}
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          />
          <span className="fg-fin-rv-count">{Math.round(zoom * 100)} %</span>
          <IconButton
            icon={ZoomInIcon}
            label="Zoom in"
            size="sm"
            disabled={zoom >= 3}
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          />
        </div>
        <div
          className="fg-fin-rv-scroll"
          tabIndex={zoom > 1 ? 0 : undefined}
          role="region"
          aria-label={`${label} page`}
        >
          <div
            className="fg-fin-rv-page"
            style={{ width: `${zoom * 100}%`, aspectRatio: String(aspect) }}
          >
            {shown ? (
              <img
                src={shown.src}
                alt={shown.alt ?? `${label}, page ${page + 1}`}
                className="fg-fin-rv-img"
                onLoad={(e) => {
                  const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                  if (w && h) setRatio((r) => ({ ...r, [page]: w / h }));
                }}
              />
            ) : null}
            {boxes.map((f) => {
              const b = clampFieldBox(f.box!);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={cx(
                    "fg-fin-rv-box",
                    `fg-fin-conf-${confidenceLevel(f.confidence)}`,
                    lit === f.id && "fg-fin-rv-lit",
                    current === f.id && "fg-fin-rv-on",
                  )}
                  style={{
                    left: `${b.x * 100}%`,
                    top: `${b.y * 100}%`,
                    width: `${b.w * 100}%`,
                    height: `${b.h * 100}%`,
                  }}
                  aria-label={`${f.label}: ${f.value}`}
                  aria-pressed={current === f.id}
                  onClick={() => {
                    select(f);
                    list.current?.querySelector<HTMLElement>(`[data-field="${f.id}"]`)?.focus();
                  }}
                  onPointerEnter={() => setHover(f.id)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(f.id)}
                  onBlur={() => setHover(null)}
                />
              );
            })}
          </div>
        </div>
      </div>
      <ul className="fg-fin-rv-list" ref={list} aria-label={`${label}: extracted fields`}>
        {fields.length === 0 ? <li className="fg-fin-rv-empty">Nothing was recognised</li> : null}
        {fields.map((f) => {
          const level = confidenceLevel(f.confidence);
          const isEditing = editing === f.id;
          return (
            <li
              key={f.id}
              className={cx(
                "fg-fin-rv-row",
                lit === f.id && "fg-fin-rv-lit",
                current === f.id && "fg-fin-rv-on",
              )}
              onPointerEnter={() => setHover(f.id)}
              onPointerLeave={() => setHover(null)}
            >
              {isEditing ? (
                <div className="fg-fin-rv-edit">
                  <label className="fg-fin-rv-label" htmlFor={`rv-${f.id}`}>
                    {f.label}
                  </label>
                  <input
                    id={`rv-${f.id}`}
                    className="fg-input fg-fin-rv-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => save(f)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save(f);
                      else if (e.key === "Escape") {
                        e.stopPropagation();
                        setEditing(null);
                        list.current?.querySelector<HTMLElement>(`[data-field="${f.id}"]`)?.focus();
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="fg-fin-rv-main"
                  data-field={f.id}
                  aria-pressed={current === f.id}
                  onClick={() => select(f)}
                  onDoubleClick={() => editable && startEdit(f)}
                  onKeyDown={(e) => onRowKey(e, f)}
                  onFocus={() => setHover(f.id)}
                  onBlur={() => setHover(null)}
                >
                  <span className="fg-fin-rv-label">{f.label}</span>
                  <span className="fg-fin-rv-value">{f.value || "Empty"}</span>
                </button>
              )}
              <span
                className={cx("fg-fin-conf", `fg-fin-conf-${level}`)}
                title={
                  f.confidence === undefined
                    ? "Confidence unknown"
                    : `Read with ${Math.round(f.confidence * 100)} % confidence`
                }
              >
                {f.verified ? (
                  <>
                    <Icon icon={Tick02Icon} size={12} variant="mono" />
                    <span>Checked</span>
                  </>
                ) : (
                  <>
                    <span className="fg-fin-conf-bar" aria-hidden="true">
                      <i style={{ width: `${Math.round((f.confidence ?? 0) * 100)}%` }} />
                    </span>
                    <span>
                      {f.confidence === undefined ? "?" : `${Math.round(f.confidence * 100)} %`}
                    </span>
                    <span className="fg-sr"> {LEVEL_WORD[level]} confidence</span>
                  </>
                )}
              </span>
              {editable && !isEditing ? (
                <IconButton
                  icon={Edit04Icon}
                  label={`Edit ${f.label}`}
                  size="sm"
                  onClick={() => startEdit(f)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
