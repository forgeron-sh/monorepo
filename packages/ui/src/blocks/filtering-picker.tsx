// The lists inside the filter popups: the fields first, then the values of one field. Each is a
// search input over a list (the Combobox parts, inline), so arrows, Enter and typing work as in the
// pickers. Shared by FilterMenu and the chips of FilterBar.
//
// Both are a root with parts. Without children they draw the usual list; with children they are a
// frame for `FieldListInput` / `FieldListEmpty` / `FieldListItems` (and the `ValueList…` ones).

import { ArrowRight01Icon, Tick02Icon } from "@forgeron/icons";
import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
} from "../combobox";
import { cx } from "../cx";
import { Icon } from "../icon";
import type { Filter, FilterField, FilterOption } from "./filtering-model";

/** Focuses the search when a list replaces the other one, so the keyboard keeps going. */
const useFocusOnMount = () =>
  useCallback((input: HTMLInputElement | null) => input?.focus({ preventScroll: true }), []);

const byLabel = <T extends { label: string }>(items: ReadonlyArray<T>, query: string) => {
  const q = query.trim().toLowerCase();
  return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : [...items];
};

type Part<T> = Omit<T, "className"> & { className?: string };

/* ---------------------------------------------------------------- FieldList */

interface FieldListContext {
  fields: ReadonlyArray<FilterField>;
  filters: ReadonlyArray<Filter>;
  placeholder: string;
}

const FieldCtx = createContext<FieldListContext | null>(null);

function useFieldList(part: string): FieldListContext {
  const ctx = useContext(FieldCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FieldList>.`);
  return ctx;
}

export interface FieldListProps {
  fields: ReadonlyArray<FilterField>;
  filters: ReadonlyArray<Filter>;
  onPick: (field: string) => void;
  placeholder?: string;
  /** The parts of the list; without them, the search and the fields. */
  children?: ReactNode;
}

/** The fields to filter on, with how many values each one already has. */
export function FieldList({
  fields,
  filters,
  onPick,
  placeholder = "Filter…",
  children,
}: FieldListProps) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => byLabel(fields, query), [fields, query]);
  return (
    <FieldCtx.Provider value={{ fields, filters, placeholder }}>
      <Combobox
        inline
        open
        autoHighlight
        items={fields.map((f) => f.id)}
        filteredItems={shown.map((f) => f.id)}
        itemToStringLabel={(id: string) => fields.find((f) => f.id === id)?.label ?? id}
        value={null}
        onValueChange={(id: string | null) => {
          if (id) onPick(id);
        }}
        inputValue={query}
        onInputValueChange={(next: string) => setQuery(next)}
      >
        {children ?? (
          <>
            <FieldListInput />
            <FieldListEmpty />
            <FieldListItems />
          </>
        )}
      </Combobox>
    </FieldCtx.Provider>
  );
}

/** The search box, focused when the list appears. */
export function FieldListInput({
  className,
  ...rest
}: Part<ComponentProps<typeof ComboboxChipsInput>>) {
  const { placeholder } = useFieldList("FieldListInput");
  const focus = useFocusOnMount();
  return (
    <div data-slot="field-list-head" className="fg-fpop-head">
      <ComboboxChipsInput
        ref={focus}
        data-slot="field-list-input"
        placeholder={placeholder}
        aria-label="Field"
        {...rest}
        className={cx("fg-fpop-input", className)}
      />
    </div>
  );
}

/** Says so when no field matches. */
export function FieldListEmpty({
  className,
  children = "No field",
  ...rest
}: Part<ComponentProps<typeof ComboboxEmpty>>) {
  return (
    <ComboboxEmpty
      data-slot="field-list-empty"
      {...rest}
      className={cx("fg-fpop-empty", className)}
    >
      {children}
    </ComboboxEmpty>
  );
}

/** The rows: an icon, the field, how many values it has, a chevron. */
export function FieldListItems(props: Part<ComponentProps<typeof ComboboxList>>) {
  const { fields, filters } = useFieldList("FieldListItems");
  const count = (id: string) => filters.find((f) => f.field === id)?.values.length ?? 0;
  return (
    <ComboboxList data-slot="field-list-items" {...props}>
      {(id: string) => {
        const field = fields.find((f) => f.id === id);
        if (!field) return null;
        const n = count(id);
        return (
          <ComboboxItem
            key={id}
            value={id}
            indicator={false}
            glyph={<Icon icon={field.icon} size={12} variant="mono" />}
            hint={n > 0 ? n : undefined}
            trailing={
              <span className="fg-fpop-chev" aria-hidden="true">
                <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
              </span>
            }
          >
            {field.label}
          </ComboboxItem>
        );
      }}
    </ComboboxList>
  );
}

/* ---------------------------------------------------------------- ValueList */

interface ValueListContext {
  field: FilterField;
  byValue: ReadonlyMap<string, FilterOption>;
  onBack: (() => void) | undefined;
  query: string;
}

const ValueCtx = createContext<ValueListContext | null>(null);

function useValueList(part: string): ValueListContext {
  const ctx = useContext(ValueCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <ValueList>.`);
  return ctx;
}

export interface ValueListProps {
  field: FilterField;
  values: ReadonlyArray<string>;
  onChange: (values: string[]) => void;
  /** Backspace in the empty input: goes back to the fields. */
  onBack?: () => void;
  /** The parts of the list; without them, the search and the values. */
  children?: ReactNode;
}

/** The values of one field, ticked several at once; the list stays open while they are ticked. */
export function ValueList({ field, values, onChange, onBack, children }: ValueListProps) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => byLabel(field.options, query), [field.options, query]);
  const byValue = useMemo(
    () => new Map(field.options.map((o) => [o.value, o] as const)),
    [field.options],
  );
  return (
    <ValueCtx.Provider value={{ field, byValue, onBack, query }}>
      <Combobox
        inline
        open
        multiple
        autoHighlight
        items={field.options.map((o) => o.value)}
        filteredItems={shown.map((o) => o.value)}
        itemToStringLabel={(v: string) => byValue.get(v)?.label ?? v}
        value={[...values]}
        onValueChange={(next: string[]) => onChange(next)}
        inputValue={query}
        onInputValueChange={(next: string, details: { isItemPress?: boolean }) => {
          if (!details.isItemPress) setQuery(next);
        }}
      >
        {children ?? (
          <>
            <ValueListInput />
            <ValueListEmpty />
            <ValueListItems />
          </>
        )}
      </Combobox>
    </ValueCtx.Provider>
  );
}

/** The search box; Backspace in it, empty, calls the list's `onBack`. */
export function ValueListInput({
  className,
  onKeyDown,
  ...rest
}: Part<ComponentProps<typeof ComboboxChipsInput>>) {
  const { field, onBack, query } = useValueList("ValueListInput");
  const focus = useFocusOnMount();
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    (onKeyDown as ((e: KeyboardEvent<HTMLInputElement>) => void) | undefined)?.(event);
    if (event.key === "Backspace" && query === "" && onBack) {
      event.preventDefault();
      onBack();
    }
  };
  return (
    <div data-slot="value-list-head" className="fg-fpop-head">
      <ComboboxChipsInput
        ref={focus}
        data-slot="value-list-input"
        placeholder={`${field.label}…`}
        aria-label={field.label}
        {...rest}
        onKeyDown={keyDown}
        className={cx("fg-fpop-input", className)}
      />
    </div>
  );
}

/** Says so when no value matches. */
export function ValueListEmpty({
  className,
  children = "No match",
  ...rest
}: Part<ComponentProps<typeof ComboboxEmpty>>) {
  return (
    <ComboboxEmpty
      data-slot="value-list-empty"
      {...rest}
      className={cx("fg-fpop-empty", className)}
    >
      {children}
    </ComboboxEmpty>
  );
}

/** The rows: a checkbox, the mark of the value, its label and its count. */
export function ValueListItems(props: Part<ComponentProps<typeof ComboboxList>>) {
  const { byValue } = useValueList("ValueListItems");
  return (
    <ComboboxList data-slot="value-list-items" {...props}>
      {(v: string) => {
        const option = byValue.get(v);
        if (!option) return null;
        return (
          <ComboboxItem
            key={v}
            value={v}
            indicator={false}
            glyph={
              <>
                <span className="fg-check-box" aria-hidden="true">
                  <ComboboxItemIndicator>
                    <Icon icon={Tick02Icon} size={12} variant="mono" />
                  </ComboboxItemIndicator>
                </span>
                {option.glyph}
              </>
            }
            hint={option.hint || undefined}
          >
            {option.label}
          </ComboboxItem>
        );
      }}
    </ComboboxList>
  );
}
