// A grid of templates to start a document from: search, categories, a blank entry first, and a
// pane that previews the one you point at before you choose it.
//
// With props it is the whole gallery; with children it is the root of the parts:
//
//   <TemplateGallery templates={templates} onChoose={create}>
//     <TemplateGalleryMain>
//       <TemplateGalleryBar><TemplateGallerySearch /><TemplateGalleryCategories /></TemplateGalleryBar>
//       <TemplateGalleryGrid />
//       <TemplateGalleryEmpty />
//     </TemplateGalleryMain>
//     <TemplateGalleryPane />
//   </TemplateGallery>

import type { IconDefinition } from "@forgeron/icons";
import { File01Icon, Search01Icon } from "@forgeron/icons";
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Input } from "../form";
import { useCollection, type Collection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { PartElement as Part } from "../part";
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
  /** The parts. Without them the gallery draws the search, the grid and the pane. */
  children?: ReactNode;
  className?: string;
}

const BLANK = "__blank";

interface GalleryContext {
  templates: ReadonlyArray<TemplateItem>;
  text: string;
  setText: (text: string) => void;
  category: string | null;
  setCategory: (category: string | null) => void;
  categories: ReturnType<typeof structureTemplateCategories>;
  shown: ReadonlyArray<TemplateItem>;
  showBlank: boolean;
  hasBlank: boolean;
  blankInfo: { name?: string; description?: string };
  entries: ReadonlyArray<string>;
  /** The id pointed at, `"__blank"` for the blank entry. */
  current: string;
  template: TemplateItem | null;
  collection: Collection;
  choose: (id: string | null) => void;
  chooseLabel: string;
  hint: string;
  empty: ReactNode;
  searchId: string;
}

const Ctx = createContext<GalleryContext | null>(null);

/** The state of the enclosing `TemplateGallery`: the filtered templates, the one pointed at. */
export function useTemplateGallery(): GalleryContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TemplateGallery parts go inside a <TemplateGallery>.");
  return ctx;
}

type Div = Omit<ComponentProps<"div">, "ref"> & { asChild?: boolean };

/** The left side: the bar, the grid and the empty note. */
export function TemplateGalleryMain({ asChild, className, ...rest }: Div) {
  return (
    <Part
      asChild={asChild}
      data-slot="template-gallery-main"
      {...rest}
      className={cx("fg-tgal-main", className)}
    />
  );
}

/** The row of the search and the categories. */
export function TemplateGalleryBar({ asChild, className, ...rest }: Div) {
  return (
    <Part
      asChild={asChild}
      data-slot="template-gallery-bar"
      {...rest}
      className={cx("fg-tgal-bar", className)}
    />
  );
}

/** The search field. */
export function TemplateGallerySearch({
  placeholder = "Search templates",
  className,
  ...rest
}: Omit<ComponentProps<"label">, "ref" | "onChange"> & { placeholder?: string }) {
  const { text, setText, searchId } = useTemplateGallery();
  return (
    <label
      htmlFor={searchId}
      data-slot="template-gallery-search"
      {...rest}
      className={cx("fg-tgal-search", className)}
    >
      <Icon icon={Search01Icon} size={12} variant="mono" />
      <span className="fg-visually-hidden">Search templates</span>
      <Input
        id={searchId}
        type="search"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
      />
    </label>
  );
}

/** The categories as buttons, with their counts; none when the templates have no category. */
export function TemplateGalleryCategories({
  allLabel = "All",
  className,
  ...rest
}: Omit<ComponentProps<"div">, "ref"> & { allLabel?: string }) {
  const { categories, category: cat, setCategory: setCat } = useTemplateGallery();
  if (categories.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Category"
      data-slot="template-gallery-categories"
      {...rest}
      className={cx("fg-tgal-cats", className)}
    >
      <button
        type="button"
        className="fg-tgal-catbtn"
        aria-pressed={cat === null}
        onClick={() => setCat(null)}
      >
        {allLabel}
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
  );
}

export interface TemplateGalleryCardProps extends Omit<ComponentProps<"div">, "ref" | "id"> {
  /** The template the card is of, or `null` for the blank entry. */
  template: TemplateItem | null;
}

/** One card: the thumbnail, the name with the search marked, a badge and the category. */
export function TemplateGalleryCard({
  template,
  className,
  children,
  ...rest
}: TemplateGalleryCardProps) {
  const { collection, current, text, blankInfo } = useTemplateGallery();
  const id = template ? template.id : BLANK;
  const name = template ? template.name : (blankInfo.name ?? "Blank");
  return (
    <div
      data-template={id}
      data-slot="template-gallery-card"
      {...rest}
      {...collection.getItemProps(id, {
        role: "option",
        className: cx(
          "fg-tgal-card",
          current === id && "fg-tgal-card-current",
          !template && "fg-tgal-card-blank",
          className,
        ),
      })}
    >
      {children ?? (
        <>
          <span className="fg-tgal-thumb" aria-hidden="true">
            {template?.thumbnail ?? (
              <Icon
                icon={template?.icon ?? File01Icon}
                size={24}
                variant={template ? "duo" : "mono"}
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
          {template?.badge ? <span className="fg-tgal-badge">{template.badge}</span> : null}
          {template?.category ? <span className="fg-tgal-cat">{template.category}</span> : null}
        </>
      )}
    </div>
  );
}

/** The listbox of cards: the blank entry first, then the templates that match. */
export function TemplateGalleryGrid({ className, children, ...rest }: Omit<Div, "asChild">) {
  const { collection, showBlank, shown } = useTemplateGallery();
  return (
    <div
      data-slot="template-gallery-grid"
      {...rest}
      {...collection.getContainerProps({
        role: "listbox",
        "aria-label": "Templates",
        className: cx("fg-tgal-grid", className),
      })}
    >
      {children ?? (
        <>
          {showBlank ? <TemplateGalleryCard template={null} /> : null}
          {shown.map((t) => (
            <TemplateGalleryCard key={t.id} template={t} />
          ))}
        </>
      )}
    </div>
  );
}

/** Said when the search finds nothing. */
export function TemplateGalleryEmpty({ className, children, ...rest }: Omit<Div, "asChild">) {
  const { shown, showBlank, empty } = useTemplateGallery();
  if (shown.length > 0 || showBlank) return null;
  return (
    <div
      role="status"
      data-slot="template-gallery-empty"
      {...rest}
      className={cx("fg-tgal-empty", className)}
    >
      {children ?? empty ?? "No template matches."}
    </div>
  );
}

/** The pane: the preview of the template pointed at, its name, its text and the button. */
export function TemplateGalleryPane({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"aside">, "ref">) {
  const { entries, template, hasBlank, blankInfo, hint, choose, chooseLabel } =
    useTemplateGallery();
  return (
    <aside
      aria-label="Preview"
      aria-live="polite"
      data-slot="template-gallery-pane"
      {...rest}
      className={cx("fg-tgal-pane", className)}
    >
      {children ??
        (entries.length === 0 || (!template && !hasBlank) ? (
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
            <Button variant="primary" onClick={() => choose(template ? template.id : null)}>
              {chooseLabel}
            </Button>
          </>
        ))}
    </aside>
  );
}

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
  children,
  className,
  ...rest
}: TemplateGalleryProps & Omit<ComponentProps<"div">, keyof TemplateGalleryProps | "ref">) {
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
  const choose = (id: string | null) => onChoose(id);

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
    onAction: (id) => choose(id === BLANK ? null : id),
    orientation: "grid",
    clearOnEscape: false,
  });

  const ctx: GalleryContext = {
    templates,
    text,
    setText,
    category: cat,
    setCategory: setCat,
    categories,
    shown,
    showBlank,
    hasBlank,
    blankInfo,
    entries,
    current,
    template,
    collection,
    choose,
    chooseLabel,
    hint,
    empty,
    searchId,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div data-slot="template-gallery" {...rest} className={cx("fg-tgal", className)}>
        {children ?? (
          <>
            <TemplateGalleryMain>
              <TemplateGalleryBar>
                <TemplateGallerySearch />
                <TemplateGalleryCategories />
              </TemplateGalleryBar>
              <TemplateGalleryGrid />
              <TemplateGalleryEmpty />
            </TemplateGalleryMain>
            <TemplateGalleryPane />
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}
