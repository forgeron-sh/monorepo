// A grid of templates to start a document from: search, categories, a blank entry first, and a
// pane that previews the one you point at before you choose it.

import type { IconDefinition } from "@forgeron/icons";
import { File01Icon, Search01Icon } from "@forgeron/icons";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Input } from "../form";
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
  const grid = useRef<HTMLDivElement>(null);
  const searchId = useId();

  const categories = structureTemplateCategories(templates);
  const shown = structureFilterTemplates(templates, cat, text);
  // The blank entry belongs to "All" and to a search that does not exclude it.
  const showBlank = hasBlank && !cat && !text.trim();
  const entries = [...(showBlank ? [BLANK] : []), ...shown.map((t) => t.id)];
  const current = pointed === null ? BLANK : pointed;
  const template = templates.find((t) => t.id === pointed) ?? null;
  const stop = entries.includes(current) ? current : entries[0];

  const focusEntry = (id: string) => {
    point(id === BLANK ? null : id);
    Array.from(grid.current?.querySelectorAll<HTMLElement>("[data-template]") ?? [])
      .find((el) => el.dataset.template === id)
      ?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-template]");
    if (!el) return;
    const id = el.dataset.template!;
    const at = entries.indexOf(id);
    const go = (to: number) => {
      const next = entries[Math.min(Math.max(to, 0), entries.length - 1)];
      if (next) focusEntry(next);
    };
    // Up and Down move by a row: the number of cards on the line of this one.
    const cards = Array.from(grid.current?.querySelectorAll<HTMLElement>("[data-template]") ?? []);
    const perRow = Math.max(1, cards.filter((c) => c.offsetTop === el.offsetTop).length);
    switch (event.key) {
      case "ArrowRight":
        go(at + 1);
        break;
      case "ArrowLeft":
        go(at - 1);
        break;
      case "ArrowDown":
        go(at + perRow);
        break;
      case "ArrowUp":
        go(at - perRow);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(entries.length - 1);
        break;
      case "Enter":
        onChoose(id === BLANK ? null : id);
        break;
      case " ":
        point(id === BLANK ? null : id);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const card = (id: string, name: string, info: TemplateItem | null) => {
    const on = current === id;
    return (
      <div
        key={id}
        role="option"
        data-template={id}
        aria-selected={on}
        tabIndex={id === stop ? 0 : -1}
        className={cx(
          "fg-tgal-card",
          on && "fg-tgal-card-current",
          id === BLANK && "fg-tgal-card-blank",
        )}
        onClick={() => {
          focusEntry(id);
        }}
        onDoubleClick={() => onChoose(id === BLANK ? null : id)}
        onFocus={(e) => {
          if (e.target === e.currentTarget) point(id === BLANK ? null : id);
        }}
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
          ref={grid}
          role="listbox"
          aria-label="Templates"
          className="fg-tgal-grid"
          onKeyDown={onKeyDown}
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
