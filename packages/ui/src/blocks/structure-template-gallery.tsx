// A grid of templates to start a document from: search, categories, a blank entry first, and a
// pane that previews the one you point at before you choose it.

import type { IconDefinition } from "@forgeron/icons";
import { File01Icon, Search01Icon } from "@forgeron/icons";
import { useId, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Input } from "../form";
import { useCollection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import {
  structureFilterTemplates,
  structureHighlight,
  structureTemplateCategories,
} from "./structure-model";

export interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  /** Extra words the search also reads. */
  keywords?: ReadonlyArray<string>;
  /** On the card, in place of the default page mark. */
  icon?: IconDefinition;
  /** A small picture for the card: a drawing of the layout. */
  thumbnail?: ReactNode;
  /** In the pane: what a document made from it starts with. */
  preview?: ReactNode;
  /** A word on the card: "New", "Team". */
  badge?: string;
}

export interface TemplateGalleryProps {
  templates: ReadonlyArray<TemplateItem>;
  /** The category shown; `null` is all of them. */
  category?: string | null;
  defaultCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** The template pointed at: its preview is in the pane. `null` is the blank entry. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /** An entry to start from nothing, first in the grid. `false` leaves it out. Default `true`. */
  blank?: boolean | { name?: string; description?: string };
  /** Chosen: the button, Enter, or a double click. `null` is the blank entry. */
  onChoose: (id: string | null) => void;
  /** The button of the pane. Default "Use template". */
  chooseLabel?: string;
  /** Written in the pane while nothing is pointed at. */
  hint?: string;
  /** Shown when the search finds nothing. */
  empty?: ReactNode;
  className?: string;
}

const BLANK = "__blank";

/** A gallery of templates with a search, categories, a blank entry and a preview pane. */
export function TemplateGallery({
  templates,
  category,
  defaultCategory = null,
  onCategoryChange,
  query,
  defaultQuery = "",
  onQueryChange,
  selected,
  defaultSelected,
  onSelectedChange,
  blank = true,
  onChoose,
  chooseLabel = "Use template",
  hint = "Point at a template to see what it starts with.",
  empty,
  className,
}: TemplateGalleryProps) {
  const [cat, setCat] = useControllableState<string | null>({
    value: category,
    defaultValue: defaultCategory,
    onChange: onCategoryChange,
  });
  const [text, setText] = useControllableState<string>({
    value: query,
    defaultValue: defaultQuery,
    onChange: onQueryChange,
  });
  const hasBlank = blank !== false;
  const blankInfo = typeof blank === "object" ? blank : {};
  const [pointed, point] = useControllableState<string | null>({
    value: selected,
    defaultValue:
      defaultSelected !== undefined
        ? defaultSelected
        : hasBlank
          ? null
          : (templates[0]?.id ?? null),
    onChange: onSelectedChange,
  });
  const searchId = useId();

  const categories = structureTemplateCategories(templates);
  const shown = structureFilterTemplates(templates, cat, text);
  // The blank entry belongs to "All" and to a search that does not exclude it.
  const showBlank = hasBlank && !cat && !text.trim();
  const entries = [...(showBlank ? [BLANK] : []), ...shown.map((t) => t.id)];
  const current = pointed === null ? BLANK : pointed;
  const template = templates.find((t) => t.id === pointed) ?? null;

  // The card pointed at is the selection and the one tab stop; the arrows move it by a row or a
  // card, Enter and a double click choose, Space points.
  const collection = useCollection({
    items: entries,
    getId: (id) => id,
    selectionMode: "single",
    selected: entries.includes(current) ? [current] : [],
    onSelectedChange: (ids) => {
      if (ids[0] !== undefined) point(ids[0] === BLANK ? null : ids[0]);
    },
    focused: entries.includes(current) ? current : null,
    onAction: (id) => onChoose(id === BLANK ? null : id),
    orientation: "grid",
    clearOnEscape: false,
  });

  const card = (id: string, name: string, info: TemplateItem | null) => {
    const on = current === id;
    return (
      <div
        key={id}
        data-template={id}
        {...collection.getItemProps(id, {
          role: "option",
          className: cx(
            "fg-tgal-card",
            on && "fg-tgal-card-current",
            id === BLANK && "fg-tgal-card-blank",
          ),
        })}
      >
        <span className="fg-tgal-thumb" aria-hidden="true">
          {info?.thumbnail ?? (
            <Icon
              icon={info?.icon ?? File01Icon}
              size={24}
              variant={id === BLANK ? "mono" : "duo"}
            />
          )}
        </span>
        <span className="fg-tgal-name">
          {structureHighlight(name, text).map((s, i) =>
            s.match ? (
              <mark key={i} className="fg-tgal-mark">
                {s.text}
              </mark>
            ) : (
              s.text
            ),
          )}
        </span>
        {info?.badge ? <span className="fg-tgal-badge">{info.badge}</span> : null}
        {info?.category ? <span className="fg-tgal-cat">{info.category}</span> : null}
      </div>
    );
  };

  return (
    <div className={cx("fg-tgal", className)}>
      <div className="fg-tgal-main">
        <div className="fg-tgal-bar">
          <label className="fg-tgal-search" htmlFor={searchId}>
            <Icon icon={Search01Icon} size={12} variant="mono" />
            <span className="fg-visually-hidden">Search templates</span>
            <Input
              id={searchId}
              type="search"
              value={text}
              placeholder="Search templates"
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          {categories.length > 0 ? (
            <div role="group" aria-label="Category" className="fg-tgal-cats">
              <button
                type="button"
                className="fg-tgal-catbtn"
                aria-pressed={cat === null}
                onClick={() => setCat(null)}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="fg-tgal-catbtn"
                  aria-pressed={cat === c.id}
                  onClick={() => setCat(cat === c.id ? null : c.id)}
                >
                  {c.id}
                  <span className="fg-tgal-catcount">{c.count}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div
          {...collection.getContainerProps({
            role: "listbox",
            "aria-label": "Templates",
            className: "fg-tgal-grid",
          })}
        >
          {showBlank ? card(BLANK, blankInfo.name ?? "Blank", null) : null}
          {shown.map((t) => card(t.id, t.name, t))}
        </div>
        {shown.length === 0 && !showBlank ? (
          <div className="fg-tgal-empty" role="status">
            {empty ?? "No template matches."}
          </div>
        ) : null}
      </div>
      <aside className="fg-tgal-pane" aria-label="Preview" aria-live="polite">
        {entries.length === 0 || (!template && !hasBlank) ? (
          <p className="fg-tgal-hint">{hint}</p>
        ) : (
          <>
            <div className="fg-tgal-preview">
              {template?.preview ?? (
                <span className="fg-tgal-previewmark" aria-hidden="true">
                  <Icon
                    icon={template?.icon ?? File01Icon}
                    size={36}
                    variant={template ? "duo" : "mono"}
                  />
                </span>
              )}
            </div>
            <h3 className="fg-tgal-title">
              {template ? template.name : (blankInfo.name ?? "Blank")}
            </h3>
            <p className="fg-tgal-desc">
              {template
                ? (template.description ?? "")
                : (blankInfo.description ?? "An empty page. Write whatever you want.")}
            </p>
            <Button variant="primary" onClick={() => onChoose(template ? template.id : null)}>
              {chooseLabel}
            </Button>
          </>
        )}
      </aside>
    </div>
  );
}
