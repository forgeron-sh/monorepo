// The icon picker, after the "Change icon" popover of Notes and the reaction picker of Chat: a
// trigger that shows the current icon, a popover with a search, Recent, the common set, curated
// sections, then every drawn icon. The value is an icon name (`rocket-01`), so it can be stored;
// `IconByName` draws a stored name. The catalog loads on demand (see `icon-picker-catalog.ts`).

import { Popover } from "@base-ui/react/popover";
import { ArrowDown01Icon, ShuffleIcon, SmileIcon } from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode, RefObject } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { hasPart } from "./part";
import { cx } from "./cx";
import { useControllableState, useDisclosure } from "./hooks";
import { Icon } from "./icon";
import { IconButton } from "./identity";
import {
  catalogStore,
  findIcon,
  ICON_SECTIONS,
  iconLabel,
  loadIconCatalog,
  provisionalEntries,
  searchIcons,
  type IconEntry,
  type IconSection,
} from "./icon-picker-catalog";

export { ICON_SECTIONS, loadIconCatalog, searchIcons } from "./icon-picker-catalog";
export type { IconCatalog, IconEntry, IconSection } from "./icon-picker-catalog";

/* ---------------------------------------------------------------- tones */

export type IconTone = "ink" | "muted" | "accent" | "success" | "warning" | "danger";

/** The colours an icon may take: the text, the accent, the status colours. */
export const ICON_TONES: ReadonlyArray<{ id: IconTone; label: string }> = [
  { id: "ink", label: "Ink" },
  { id: "muted", label: "Muted" },
  { id: "accent", label: "Accent" },
  { id: "success", label: "Success" },
  { id: "warning", label: "Warning" },
  { id: "danger", label: "Danger" },
];

const toneClass = (tone: IconTone | undefined) => (tone ? `fg-iconpick-tone-${tone}` : undefined);

/* ---------------------------------------------------------------- IconByName */

const useCatalog = () =>
  useSyncExternalStore(catalogStore.subscribe, catalogStore.get, catalogStore.getServer);

export interface IconByNameProps extends Omit<
  ComponentProps<"span">,
  "className" | "children" | "title"
> {
  /** A name of `@forgeron/icons`, as the picker stores it. Empty: the placeholder square. */
  name: string | null | undefined;
  /** In px; a multiple of 12 keeps every pixel whole. */
  size?: number;
  /** One colour for the whole icon. Absent: the text colour, secondary pixels in accent. */
  tone?: IconTone;
  /** Names the icon for assistive technology; without it the icon is decorative. */
  title?: string;
  className?: string;
}

/**
 * Draws an icon from its stored name. A name of the common set draws at once (on the server too);
 * any other loads the catalog chunk first, a dim square holding its place meanwhile.
 */
export function IconByName({ name, size = 24, tone, title, className, ...rest }: IconByNameProps) {
  const catalog = useCatalog();
  const icon = name ? findIcon(name, catalog) : undefined;
  const waiting = Boolean(name) && !icon && !catalog;
  useEffect(() => {
    if (waiting) void loadIconCatalog();
  }, [waiting]);
  if (!icon) {
    return (
      <span
        data-slot="icon-by-name"
        {...rest}
        className={cx("fg-iconpick-ph", className)}
        style={{ width: size, height: size }}
        {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
      />
    );
  }
  return (
    <Icon
      icon={icon}
      size={size}
      variant={tone && tone !== "ink" ? "mono" : "duo"}
      data-slot="icon-by-name"
      {...rest}
      className={cx(toneClass(tone), className)}
      {...(title ? { title } : {})}
    />
  );
}

/* ---------------------------------------------------------------- keyboard */

/**
 * The next cell of a grid laid out in rows (sections of uneven length, each cut in rows): arrows
 * move one cell or one row, Home and End go to the ends of the row (with Ctrl or ⌘, of the grid),
 * Page Up and Down move `page` rows. `null` for another key.
 */
export function moveInRows(
  rows: ReadonlyArray<ReadonlyArray<number>>,
  index: number,
  key: string,
  options: { toEnds?: boolean; page?: number } = {},
): number | null {
  const count = rows.reduce((n, r) => n + r.length, 0);
  if (count === 0) return null;
  if (index < 0) {
    return ["ArrowRight", "ArrowDown", "Home", "PageDown"].includes(key)
      ? 0
      : ["ArrowLeft", "ArrowUp", "End", "PageUp"].includes(key)
        ? count - 1
        : null;
  }
  const r = rows.findIndex((row) => row.includes(index));
  const row = rows[r];
  if (!row) return 0;
  const c = row.indexOf(index);
  const cellAt = (target: number) => {
    const next = rows[Math.max(0, Math.min(rows.length - 1, target))]!;
    return next[Math.min(c, next.length - 1)]!;
  };
  const page = options.page ?? 5;
  switch (key) {
    case "ArrowRight":
      return Math.min(index + 1, count - 1);
    case "ArrowLeft":
      return Math.max(index - 1, 0);
    case "ArrowDown":
      return cellAt(r + 1);
    case "ArrowUp":
      return cellAt(r - 1);
    case "PageDown":
      return cellAt(r + page);
    case "PageUp":
      return cellAt(r - page);
    case "Home":
      return options.toEnds ? 0 : row[0]!;
    case "End":
      return options.toEnds ? count - 1 : row[row.length - 1]!;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- recents */

function readRecents(key: string | undefined): string[] {
  if (!key) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((n): n is string => typeof n === "string") : [];
  } catch {
    return [];
  }
}

function writeRecents(key: string | undefined, names: ReadonlyArray<string>) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(names));
  } catch {
    // Storage full or blocked: the recents stay for this visit.
  }
}

/* ---------------------------------------------------------------- IconPicker */

export interface IconPickerProps extends Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange" | "children" | "className" | "id" | "aria-describedby"
> {
  /** The icon's name, e.g. `rocket-01`; `null` for none. */
  value?: string | null;
  defaultValue?: string | null;
  /** A name, or `null` when the icon is removed. */
  onChange?: (name: string | null) => void;
  /** Opens and closes the popover from outside, e.g. from a shortcut. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * `square` (default): the icon in a framed square, a page's icon. `chip`: on a record, with its
   * name. `field`: a form control, 32px with its caret.
   */
  variant?: "square" | "chip" | "field";
  /** The icon's size in the square, in px (multiples of 12). Default 24. */
  size?: number;
  /** What the icon is for: names the trigger and the popover. Default "Icon". */
  label?: string;
  /** The chip and the field without an icon. Default "Add icon". */
  placeholder?: string;
  /** Offers "Remove" when an icon is set. Default true. */
  removable?: boolean;
  /** Offers a random icon next to the search. Default true. */
  random?: boolean;
  /**
   * Remembers the last icons picked in `localStorage` under this key, shared by every picker
   * with the same key. Absent: Recent lasts as long as the picker.
   */
  recentsKey?: string;
  /** Offers a colour for the icon: `true` for every tone, or the tones to offer. */
  tones?: boolean | ReadonlyArray<IconTone>;
  tone?: IconTone;
  defaultTone?: IconTone;
  onToneChange?: (tone: IconTone) => void;
  /** The sections shown before "All icons". Default `ICON_SECTIONS`. */
  sections?: ReadonlyArray<IconSection>;
  /** Icons per row. Default 10. */
  columns?: number;
  disabled?: boolean;
  /** On the trigger, for a `Field`: `{(props) => <IconPicker variant="field" {...props} />}`. */
  id?: string;
  "aria-describedby"?: string;
  /** Drawn in the trigger in place of the icon. */
  children?: ReactNode;
  className?: string;
}

export interface ViewSection {
  id: string;
  label: string;
  items: ReadonlyArray<IconEntry>;
  /** How many more the section has than it draws. */
  more: number;
}

const STEP = 200;

/** The state every part of an icon picker reads. */
export interface IconPickerState {
  id: string;
  label: string;
  value: string | null;
  tone: IconTone;
  /** The tone to draw with, or undefined when the picker offers none. */
  shownTone: IconTone | undefined;
  offeredTones: ReadonlyArray<{ id: IconTone; label: string }>;
  setTone: (tone: IconTone) => void;
  catalogReady: boolean;
  query: string;
  view: ReadonlyArray<ViewSection>;
  /** Every cell, in order. */
  items: ReadonlyArray<IconEntry>;
  starts: ReadonlyArray<number>;
  /** The index of the highlighted cell, or -1. */
  current: number;
  shown: IconEntry | undefined;
  columns: number;
  removable: boolean;
  random: boolean;
  choose: (name: string | null) => void;
  shuffle: () => void;
  setActive: (index: number) => void;
  setQuery: (query: string) => void;
  grow: () => void;
  growIfNear: (index: number) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  input: RefObject<HTMLInputElement | null>;
  disabled: boolean | undefined;
}

const IconPickerContext = createContext<IconPickerState | null>(null);

/** The state of the enclosing `IconPicker`: the value, the search, the highlighted cell… */
export function useIconPicker(): IconPickerState {
  const state = useContext(IconPickerContext);
  if (!state) throw new Error("useIconPicker must be used inside an IconPicker");
  return state;
}

export interface IconPickerRootProps {
  /** The icon's name, e.g. `rocket-01`; `null` for none. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (name: string | null) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** What the icon is for: names the trigger and the popover. Default "Icon". */
  label?: string;
  removable?: boolean;
  random?: boolean;
  recentsKey?: string;
  tones?: boolean | ReadonlyArray<IconTone>;
  tone?: IconTone;
  defaultTone?: IconTone;
  onToneChange?: (tone: IconTone) => void;
  sections?: ReadonlyArray<IconSection>;
  columns?: number;
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * An icon by name: search, Recent, the common set, sections, every drawn icon. With parts as
 * children (`IconPickerTrigger`, `IconPickerContent`…), the root of those; otherwise the props form,
 * whose `children` are drawn in the trigger.
 */
export function IconPicker(props: IconPickerProps | IconPickerRootProps) {
  return hasPart(props.children, ICON_PICKER_PARTS) ? (
    <IconPickerRoot {...(props as IconPickerRootProps)} />
  ) : (
    <IconPickerField {...(props as IconPickerProps)} />
  );
}

function IconPickerField({
  value,
  defaultValue,
  onChange,
  open,
  onOpenChange,
  label,
  removable,
  random,
  recentsKey,
  tones,
  tone,
  defaultTone,
  onToneChange,
  sections,
  columns,
  disabled,
  ...trigger
}: IconPickerProps) {
  const root: IconPickerRootProps = {
    ...(value !== undefined ? { value } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(onChange ? { onChange } : {}),
    ...(open !== undefined ? { open } : {}),
    ...(onOpenChange ? { onOpenChange } : {}),
    ...(label !== undefined ? { label } : {}),
    ...(removable !== undefined ? { removable } : {}),
    ...(random !== undefined ? { random } : {}),
    ...(recentsKey !== undefined ? { recentsKey } : {}),
    ...(tones !== undefined ? { tones } : {}),
    ...(tone !== undefined ? { tone } : {}),
    ...(defaultTone !== undefined ? { defaultTone } : {}),
    ...(onToneChange ? { onToneChange } : {}),
    ...(sections ? { sections } : {}),
    ...(columns !== undefined ? { columns } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
  };
  return (
    <IconPickerRoot {...root}>
      <IconPickerTrigger {...trigger} />
      <IconPickerContent>
        <IconPickerHeader />
        <IconPickerSearch />
        <IconPickerTones />
        <IconPickerGrid />
        <IconPickerFooter />
      </IconPickerContent>
    </IconPickerRoot>
  );
}

function IconPickerRoot({
  value: valueProp,
  defaultValue = null,
  onChange,
  open: openProp,
  onOpenChange,
  label = "Icon",
  removable = true,
  random = true,
  recentsKey,
  tones,
  tone: toneProp,
  defaultTone = "ink",
  onToneChange,
  sections = ICON_SECTIONS,
  columns = 10,
  disabled,
  children,
}: IconPickerRootProps) {
  const id = useId();
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [tone, setTone] = useControllableState<IconTone>({
    value: toneProp,
    defaultValue: defaultTone,
    onChange: onToneChange,
  });
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [limit, setLimit] = useState(STEP);
  const [recents, setRecents] = useState<string[]>(() => readRecents(recentsKey));
  const catalog = useCatalog();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) void loadIconCatalog();
  }, [open]);

  const offeredTones =
    tones === true ? ICON_TONES : tones ? ICON_TONES.filter((t) => tones.includes(t.id)) : [];
  const shownTone = offeredTones.length > 0 || toneProp !== undefined ? tone : undefined;

  const view = useMemo<ViewSection[]>(() => {
    const entries = catalog?.entries ?? provisionalEntries();
    const q = query.trim();
    if (q) {
      const found = searchIcons(entries, q);
      return [
        {
          id: "results",
          label: "Results",
          items: found.slice(0, limit),
          more: Math.max(0, found.length - limit),
        },
      ];
    }
    const pick = (names: ReadonlyArray<string>) =>
      names.flatMap((name) => {
        const icon = findIcon(name, catalog);
        return icon ? [{ name, icon, keywords: [] }] : [];
      });
    const out: ViewSection[] = [];
    const recent = pick(recents);
    if (recent.length > 0) out.push({ id: "recent", label: "Recent", items: recent, more: 0 });
    for (const section of sections) {
      const items = pick(section.icons);
      if (items.length > 0) out.push({ id: section.id, label: section.label, items, more: 0 });
    }
    if (catalog) {
      out.push({
        id: "all",
        label: "All icons",
        items: catalog.entries.slice(0, limit),
        more: Math.max(0, catalog.entries.length - limit),
      });
    }
    return out;
  }, [catalog, query, limit, recents, sections]);

  const { items, rows, starts } = useMemo(() => {
    const flat: IconEntry[] = [];
    const grid: number[][] = [];
    const first: number[] = [];
    for (const section of view) {
      first.push(flat.length);
      section.items.forEach((item, i) => {
        if (i % columns === 0) grid.push([]);
        grid[grid.length - 1]!.push(flat.length);
        flat.push(item);
      });
    }
    return { items: flat, rows: grid, starts: first };
  }, [view, columns]);

  const current = active < items.length ? active : items.length - 1;
  const shown = current >= 0 ? items[current] : undefined;

  useEffect(() => {
    if (current < 0) return;
    document.getElementById(`${id}-o${current}`)?.scrollIntoView?.({ block: "nearest" });
  }, [current, id]);

  const reset = () => {
    setQuery("");
    setActive(-1);
    setLimit(STEP);
  };
  const changeOpen = (next: boolean) => {
    if (!next) reset();
    setOpen(next);
  };
  const choose = (name: string | null) => {
    setValue(name);
    if (name) {
      const next = [name, ...recents.filter((n) => n !== name)].slice(0, columns);
      setRecents(next);
      writeRecents(recentsKey, next);
    }
    changeOpen(false);
  };
  const shuffle = () => {
    const pool = catalog?.entries ?? provisionalEntries();
    const entry = pool[Math.floor(Math.random() * pool.length)];
    if (entry) choose(entry.name);
  };
  const growIfNear = (index: number) => {
    const last = view[view.length - 1];
    const start = starts[starts.length - 1] ?? 0;
    if (last && last.more > 0 && index >= start + last.items.length - columns * 3) {
      setLimit((l) => l + STEP);
    }
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const target = current >= 0 ? items[current] : query.trim() ? items[0] : undefined;
      if (target) {
        event.preventDefault();
        choose(target.name);
      }
      return;
    }
    if (event.key === "Escape" && query) {
      event.preventDefault();
      event.stopPropagation();
      setQuery("");
      setActive(-1);
      return;
    }
    const next = moveInRows(rows, current, event.key, {
      toEnds: event.ctrlKey || event.metaKey,
    });
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    growIfNear(next);
  };

  const state: IconPickerState = {
    id,
    label,
    value,
    tone,
    shownTone,
    offeredTones,
    setTone,
    catalogReady: Boolean(catalog),
    query,
    view,
    items,
    starts,
    current,
    shown,
    columns,
    removable,
    random,
    choose,
    shuffle,
    setActive,
    setQuery: (next) => {
      setQuery(next);
      setActive(next.trim() ? 0 : -1);
      setLimit(STEP);
    },
    grow: () => setLimit((l) => l + STEP),
    growIfNear,
    onSearchKeyDown,
    input,
    disabled,
  };

  return (
    <IconPickerContext.Provider value={state}>
      <Popover.Root open={open} onOpenChange={changeOpen}>
        {children}
      </Popover.Root>
    </IconPickerContext.Provider>
  );
}

export type IconPickerTriggerProps = Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange" | "className" | "id"
> & {
  /**
   * `square` (default): the icon in a framed square, a page's icon. `chip`: on a record, with its
   * name. `field`: a form control, 32px with its caret.
   */
  variant?: "square" | "chip" | "field";
  /** The icon's size in the square, in px (multiples of 12). Default 24. */
  size?: number;
  /** The chip and the field without an icon. Default "Add icon". */
  placeholder?: string;
  id?: string;
  className?: string;
};

/** The button that shows the current icon and opens the picker; its children replace the icon. */
export function IconPickerTrigger({
  variant = "square",
  size = 24,
  placeholder = "Add icon",
  className,
  children,
  style,
  ...rest
}: IconPickerTriggerProps) {
  const { label, value, shownTone, disabled } = useIconPicker();
  const triggerName = value ? iconLabel(value) : null;
  const glyph = (px: number) =>
    value ? (
      <IconByName name={value} size={px} {...(shownTone ? { tone: shownTone } : {})} />
    ) : (
      <Icon icon={SmileIcon} size={px} variant="mono" className="fg-iconpick-none" />
    );
  return (
    <Popover.Trigger
      data-slot="icon-picker"
      aria-label={triggerName ? `${label}: ${triggerName}` : label}
      disabled={disabled}
      {...(rest as object)}
      className={cx(
        variant === "square" ? "fg-iconpick-square" : "fg-selm-trigger",
        variant === "chip" && "fg-selm-chip",
        variant !== "square" && !value && "fg-selm-empty",
        className,
      )}
      style={variant === "square" ? { padding: Math.round(size / 3), ...style } : style}
      onPointerEnter={() => void loadIconCatalog()}
      onFocus={() => void loadIconCatalog()}
    >
      {children ??
        (variant === "square" ? (
          glyph(size)
        ) : (
          <>
            {glyph(12)}
            <span className="fg-iconpick-name">{triggerName ?? placeholder}</span>
            {variant === "field" ? (
              <span className="fg-selm-caret" aria-hidden="true">
                <Icon icon={ArrowDown01Icon} size={12} variant="mono" />
              </span>
            ) : null}
          </>
        ))}
    </Popover.Trigger>
  );
}

export type IconPickerContentProps = Omit<ComponentProps<typeof Popover.Popup>, "className"> & {
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** The popover: put the header, the search, the tones, the grid and the footer in it. */
export function IconPickerContent({
  side,
  align = "start",
  sideOffset = 4,
  className,
  style,
  ...rest
}: IconPickerContentProps) {
  const { label, columns, input } = useIconPicker();
  return (
    <Popover.Portal>
      <Popover.Positioner
        className="fg-pop-positioner"
        sideOffset={sideOffset}
        align={align}
        {...(side ? { side } : {})}
      >
        <Popover.Popup
          data-slot="icon-picker-content"
          aria-label={label}
          initialFocus={input}
          {...rest}
          className={cx("fg-pop fg-iconpick", className)}
          style={{ ["--fg-iconpick-cols" as string]: columns, ...(style as object) }}
        />
      </Popover.Positioner>
    </Popover.Portal>
  );
}

/** The title and, when an icon is set, "Remove". Children replace the title. */
export function IconPickerHeader({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"div">, "className"> & { className?: string }) {
  const { value, removable, choose } = useIconPicker();
  return (
    <div data-slot="icon-picker-header" {...rest} className={cx("fg-iconpick-head", className)}>
      <span className="fg-iconpick-title">{children ?? "Icons"}</span>
      {removable && value ? (
        <button type="button" className="fg-iconpick-remove" onClick={() => choose(null)}>
          Remove
        </button>
      ) : null}
    </div>
  );
}

/** The search box (arrows move the highlighted cell, Enter picks it) and the random button. */
export function IconPickerSearch({
  className,
  onKeyDown,
  onChange,
  ...rest
}: Omit<ComponentProps<"input">, "className" | "value"> & { className?: string }) {
  const { id, label, query, setQuery, shown, current, input, onSearchKeyDown, random, shuffle } =
    useIconPicker();
  return (
    <div className="fg-iconpick-bar">
      <input
        ref={input}
        data-slot="icon-picker-search"
        role="combobox"
        aria-label={`Search ${label.toLowerCase()}s`}
        aria-expanded="true"
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        {...(shown ? { "aria-activedescendant": `${id}-o${current}` } : {})}
        placeholder="Filter…"
        spellCheck={false}
        autoComplete="off"
        {...rest}
        className={cx("fg-iconpick-input", className)}
        value={query}
        onChange={(event) => {
          onChange?.(event);
          setQuery(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) onSearchKeyDown(event);
        }}
      />
      {random ? (
        <IconButton icon={ShuffleIcon} label="Random icon" variant="boxed" onClick={shuffle} />
      ) : null}
    </div>
  );
}

/** The colours offered (`tones`), as a radio group; nothing when there are none. */
export function IconPickerTones({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "className"> & { className?: string }) {
  const { offeredTones, tone, setTone } = useIconPicker();
  if (offeredTones.length === 0) return null;
  return (
    <div
      data-slot="icon-picker-tones"
      role="radiogroup"
      aria-label="Colour"
      {...rest}
      className={cx("fg-iconpick-tones", className)}
    >
      {offeredTones.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === tone}
          aria-label={t.label}
          title={t.label}
          className={cx("fg-iconpick-tone", toneClass(t.id))}
          onClick={() => setTone(t.id)}
        />
      ))}
    </div>
  );
}

/** The sections of icons (Recent, the common set, all), as a listbox of `IconPickerItem`s. */
export function IconPickerGrid({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "className" | "children"> & { className?: string }) {
  const { id, label, view, items, starts, growIfNear, grow, catalogReady } = useIconPicker();
  return (
    <div
      id={`${id}-list`}
      data-slot="icon-picker-grid"
      role="listbox"
      aria-label={label}
      {...rest}
      className={cx("fg-iconpick-scroll", className)}
      onScroll={(event) => {
        rest.onScroll?.(event);
        const el = event.currentTarget;
        if (el.scrollTop + el.clientHeight > el.scrollHeight - 160) growIfNear(items.length);
      }}
    >
      {view.map((section, s) => (
        <div key={section.id} role="group" aria-labelledby={`${id}-s${section.id}`}>
          <div id={`${id}-s${section.id}`} className="fg-iconpick-section">
            {section.label}
          </div>
          <div className="fg-iconpick-grid">
            {section.items.map((entry, i) => (
              <IconPickerItem
                key={`${section.id}-${entry.name}`}
                entry={entry}
                index={(starts[s] ?? 0) + i}
              />
            ))}
          </div>
          {section.more > 0 ? (
            <button type="button" className="fg-iconpick-more" onClick={grow}>
              {section.more} more
            </button>
          ) : null}
        </div>
      ))}
      {items.length === 0 ? (
        <div className="fg-iconpick-empty">{catalogReady ? "No icon" : "Loading icons…"}</div>
      ) : null}
    </div>
  );
}

export interface IconPickerItemProps extends Omit<
  ComponentProps<"div">,
  "className" | "children" | "id"
> {
  /** The icon this cell draws and picks. */
  entry: IconEntry;
  /** Its place in the list, for the keyboard highlight. */
  index: number;
  className?: string;
}

/** One cell of the grid: an icon, picked by a click. */
export function IconPickerItem({ entry, index, className, ...rest }: IconPickerItemProps) {
  const { id, value, shownTone, current, setActive, choose } = useIconPicker();
  return (
    <div
      id={`${id}-o${index}`}
      data-slot="icon-picker-item"
      role="option"
      aria-label={iconLabel(entry.name)}
      aria-selected={entry.name === value}
      data-active={index === current ? "" : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={() => {
        if (index !== current) setActive(index);
      }}
      onClick={() => choose(entry.name)}
      {...rest}
      className={cx("fg-iconpick-cell", className)}
    >
      <Icon
        icon={entry.icon}
        size={24}
        variant={shownTone && shownTone !== "ink" ? "mono" : "duo"}
        {...(shownTone ? { className: toneClass(shownTone) } : {})}
      />
    </div>
  );
}

/** The `:name:` of the highlighted icon, and the live count of a search. */
export function IconPickerFooter({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "className" | "children"> & { className?: string }) {
  const { shown, value, catalogReady, query, items } = useIconPicker();
  return (
    <>
      <div
        data-slot="icon-picker-footer"
        aria-hidden="true"
        {...rest}
        className={cx("fg-iconpick-foot", className)}
      >
        {shown ? `:${shown.name}:` : value ? `:${value}:` : catalogReady ? "" : "Loading icons…"}
      </div>
      <div className="fg-sr" aria-live="polite">
        {query.trim() ? `${items.length} icons` : ""}
      </div>
    </>
  );
}

const ICON_PICKER_PARTS: ReadonlyArray<unknown> = [
  IconPickerTrigger,
  IconPickerContent,
  IconPickerHeader,
  IconPickerSearch,
  IconPickerTones,
  IconPickerGrid,
  IconPickerFooter,
];
