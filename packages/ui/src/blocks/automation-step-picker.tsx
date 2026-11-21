// The list to add a step from, after the "Add a block" panel of the Flows prototype: a search, a
// row of categories, and the triggers or actions grouped under a closed band, each with its pixel
// icon, its app and one line. The search keeps the focus; arrows move, Enter adds. The search and
// the list are the Combobox parts, open inline and filtered here (by the words and the category).
//
// Without children it is the picker above. With children they are the parts; the options stay in
// the root, which filters them:
//
//   <StepPicker options={options} onPick={add} groups={groups}>
//     <StepPickerHeader title="Add a step" context="After “Deal won”" />
//     <StepPickerSearch autoFocus />
//     <StepPickerCategories />
//     <StepPickerEmpty />
//     <StepPickerList />
//   </StepPicker>

import type { IconDefinition } from "@forgeron/icons";
import { Search01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "../combobox";
import { cx } from "../cx";
import { Icon } from "../icon";
import { renderPart } from "../part";

export interface StepOption {
  id: string;
  /** `Deal moved to Won`. */
  label: string;
  /** One line: `When a deal reaches Won`. */
  description?: string;
  icon: IconDefinition;
  /** The id of its group: `trigger`, `apps`, `logic`. */
  group: string;
  /** The app it comes from, before the description: `CRM`. */
  app?: string;
  /** A short mark at the end: `code`, `beta`. */
  tag?: string;
  /** More words the search finds it by. */
  keywords?: string;
}

export interface StepGroup {
  id: string;
  label: string;
}

export interface StepPickerProps extends Omit<
  ComponentProps<"div">,
  "className" | "title" | "children"
> {
  options: ReadonlyArray<StepOption>;
  /** The groups, in order, with their names. Without it, groups come in the order of the options. */
  groups?: ReadonlyArray<StepGroup>;
  onPick: (id: string) => void;
  /** Above the search: `Add a step`. */
  title?: ReactNode;
  /** Under the title: where the step goes, `After “Deal moved to Won”`. */
  context?: ReactNode;
  placeholder?: string;
  /** The row of groups to narrow the list; shown when there are several groups. */
  categories?: boolean;
  /** At the bottom: `Missing a step? Write a function.` and a button. */
  footer?: ReactNode;
  /** Focuses the search when shown. */
  autoFocus?: boolean;
  /** Shown when nothing matches. */
  empty?: ReactNode;
  className?: string;
  asChild?: boolean;
  /** The parts. Without them the picker is drawn whole. */
  children?: ReactNode;
}

export interface StepPickerShown {
  value: string;
  label: string;
  items: StepOption[];
}

interface StepPickerContext {
  /** The groups after the search and the category: what the list shows. */
  shown: ReadonlyArray<StepPickerShown>;
  /** Every group, in order. */
  order: ReadonlyArray<StepGroup>;
  category: string;
  setCategory: (id: string) => void;
  showCategories: boolean;
  placeholder: string;
  autoFocus: boolean | undefined;
  empty: ReactNode;
  title: ReactNode;
  context: ReactNode;
  footer: ReactNode;
}

const Ctx = createContext<StepPickerContext | null>(null);

/** The picker a part is in: what it shows after the search and the category. */
export function useStepPicker(part = "useStepPicker"): StepPickerContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <StepPicker>.`);
  return ctx;
}

/** Triggers or actions to add, grouped, searchable, from the keyboard. */
export function StepPicker({
  options,
  groups,
  onPick,
  title,
  context,
  placeholder = "Search steps",
  categories,
  footer,
  autoFocus,
  empty = "No step matches",
  className,
  asChild,
  children,
  ...rest
}: StepPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const order = useMemo(() => {
    if (groups) return groups;
    const seen: StepGroup[] = [];
    for (const o of options)
      if (!seen.some((g) => g.id === o.group)) seen.push({ id: o.group, label: o.group });
    return seen;
  }, [groups, options]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order
      .filter((g) => category === "all" || g.id === category)
      .map((g) => ({
        value: g.id,
        label: g.label,
        items: options.filter(
          (o) =>
            o.group === g.id &&
            (!q ||
              [o.label, o.description, o.app, o.keywords]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [order, options, query, category]);

  const ctx: StepPickerContext = {
    shown,
    order,
    category,
    setCategory,
    showCategories: (categories ?? true) && order.length > 1,
    placeholder,
    autoFocus,
    empty,
    title,
    context,
    footer,
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart("div", cx("fg-spick", className), asChild, {
        "data-slot": "step-picker",
        ...rest,
        children: (
          <Combobox
            inline
            open
            // Base UI accepts "always" (the first row lit as the list opens); its types say boolean.
            {...({ autoHighlight: "always" } as object)}
            loopFocus={false}
            filter={null}
            items={shown}
            value={null}
            itemToStringLabel={(o: StepOption) => o.label}
            isItemEqualToValue={(a: StepOption, b: StepOption) => a.id === b.id}
            onValueChange={(option: StepOption | null) => {
              if (option) onPick(option.id);
            }}
            inputValue={query}
            onInputValueChange={(next: string, details: { isItemPress?: boolean }) => {
              if (!details.isItemPress) setQuery(next);
            }}
          >
            {children ?? (
              <>
                <StepPickerHeader />
                <StepPickerSearch />
                <StepPickerCategories />
                <StepPickerEmpty />
                <StepPickerList />
                <StepPickerFooter />
              </>
            )}
          </Combobox>
        ),
      })}
    </Ctx.Provider>
  );
}

/* ---------------------------------------------------------------- parts */

export interface StepPickerHeaderProps extends Omit<ComponentProps<"div">, "title"> {
  title?: ReactNode;
  context?: ReactNode;
}

/** The title and, under it, where the step goes. Defaults to the root's `title` and `context`. */
export function StepPickerHeader({
  title: titleProp,
  context: contextProp,
  className,
  children,
  ...rest
}: StepPickerHeaderProps) {
  const root = useStepPicker("StepPickerHeader");
  const title = titleProp ?? root.title;
  const context = contextProp ?? root.context;
  if (!children && !title && !context) return null;
  return (
    <div data-slot="step-picker-header" {...rest} className={cx("fg-spick-head", className)}>
      {children ?? (
        <>
          {title ? <div className="fg-spick-title">{title}</div> : null}
          {context ? <div className="fg-spick-context">{context}</div> : null}
        </>
      )}
    </div>
  );
}

/** The search: it keeps the focus while the arrows move through the list. */
export function StepPickerSearch({
  className,
  placeholder: placeholderProp,
  autoFocus: autoFocusProp,
  ...rest
}: ComponentProps<typeof ComboboxChipsInput>) {
  const root = useStepPicker("StepPickerSearch");
  const placeholder = placeholderProp ?? root.placeholder;
  return (
    <label className="fg-spick-search" data-slot="step-picker-search">
      <Icon icon={Search01Icon} size={12} variant="mono" />
      <ComboboxChipsInput
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- the picker opens to be typed into
        autoFocus={autoFocusProp ?? root.autoFocus}
        aria-label={placeholder}
        placeholder={placeholder}
        {...rest}
        className={cx("fg-spick-input", className)}
      />
    </label>
  );
}

/** The row of groups that narrows the list. Nothing unless there are several groups. */
export function StepPickerCategories({ className, ...rest }: ComponentProps<"div">) {
  const { showCategories, order, category, setCategory } = useStepPicker("StepPickerCategories");
  if (!showCategories) return null;
  return (
    <div
      data-slot="step-picker-categories"
      role="group"
      aria-label="Category"
      {...rest}
      className={cx("fg-spick-cats", className)}
    >
      {[{ id: "all", label: "All" }, ...order].map((g) => (
        <button
          key={g.id}
          type="button"
          className="fg-spick-cat"
          aria-pressed={category === g.id}
          onClick={() => setCategory(g.id)}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

/** What the list says when nothing matches. */
export function StepPickerEmpty({
  className,
  children,
  ...rest
}: ComponentProps<typeof ComboboxEmpty>) {
  const { empty } = useStepPicker("StepPickerEmpty");
  return (
    <ComboboxEmpty
      data-slot="step-picker-empty"
      {...rest}
      className={cx("fg-spick-empty", className)}
    >
      {children ?? empty}
    </ComboboxEmpty>
  );
}

type ListChildren = (group: StepPickerShown) => ReactNode;

/** The groups and their steps. Children, if any, is a function from a group to what draws it. */
export function StepPickerList({
  className,
  children,
  ...rest
}: Omit<ComponentProps<typeof ComboboxList>, "children"> & { children?: ListChildren }) {
  return (
    <ComboboxList
      data-slot="step-picker-list"
      aria-label="Steps"
      {...rest}
      className={cx("fg-spick-list", className)}
    >
      {
        (children ??
          ((group: StepPickerShown) => (
            <StepPickerGroup key={group.value} group={group} />
          ))) as never
      }
    </ComboboxList>
  );
}

/** One group: its closed band, then its steps. */
export function StepPickerGroup({ group }: { group: StepPickerShown }) {
  return (
    <ComboboxGroup items={group.items}>
      <ComboboxLabel className="fg-spick-group">
        <span>{group.label}</span>
      </ComboboxLabel>
      <ComboboxCollection>
        {(o: StepOption) => <StepPickerItem key={o.id} option={o} />}
      </ComboboxCollection>
    </ComboboxGroup>
  );
}

/** One step: its tile, its name, its app and line, its tag. */
export function StepPickerItem({
  option: o,
  className,
}: {
  option: StepOption;
  className?: string;
}) {
  return (
    <ComboboxItem
      value={o}
      indicator={false}
      className={cx("fg-spick-row", className)}
      glyph={
        <span className="fg-step-tile">
          <Icon icon={o.icon} size={12} />
        </span>
      }
      trailing={o.tag ? <span className="fg-spick-tag">{o.tag}</span> : null}
    >
      <span className="fg-spick-text">
        <span className="fg-spick-label">{o.label}</span>
        {o.app || o.description ? (
          <span className="fg-spick-desc">
            {[o.app, o.description].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </span>
    </ComboboxItem>
  );
}

/** Under the list: `Missing a step?`. Nothing without the root's `footer` or children. */
export function StepPickerFooter({ className, children, ...rest }: ComponentProps<"div">) {
  const root = useStepPicker("StepPickerFooter");
  const content = children ?? root.footer;
  if (!content) return null;
  return (
    <div data-slot="step-picker-footer" {...rest} className={cx("fg-spick-foot", className)}>
      {content}
    </div>
  );
}
