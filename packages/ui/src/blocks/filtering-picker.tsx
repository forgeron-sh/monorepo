// The lists inside the filter popups: the fields first, then the values of one field. Each is a
// search input over a list (Base UI Combobox, inline), so arrows, Enter and typing work as in the
// pickers. Shared by FilterMenu and the chips of FilterBar.

import { Combobox } from "@base-ui/react/combobox";
import { ArrowRight01Icon, Tick02Icon } from "@forgeron/icons";
import type { KeyboardEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { Icon } from "../icon";
import type { Filter, FilterField, FilterOption } from "./filtering-model";

/** Focuses the search when a list replaces the other one, so the keyboard keeps going. */
const useFocusOnMount = () =>
  useCallback((input: HTMLInputElement | null) => input?.focus({ preventScroll: true }), []);

const byLabel = <T extends { label: string }>(items: ReadonlyArray<T>, query: string) => {
  const q = query.trim().toLowerCase();
  return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : [...items];
};

export interface FieldListProps {
  fields: ReadonlyArray<FilterField>;
  filters: ReadonlyArray<Filter>;
  onPick: (field: string) => void;
  placeholder?: string;
}

/** The fields to filter on, with how many values each one already has. */
export function FieldList({ fields, filters, onPick, placeholder = "Filter…" }: FieldListProps) {
  const [query, setQuery] = useState("");
  const focus = useFocusOnMount();
  const shown = useMemo(() => byLabel(fields, query), [fields, query]);
  const count = (id: string) => filters.find((f) => f.field === id)?.values.length ?? 0;
  return (
    <Combobox.Root<string>
      inline
      open
      autoHighlight
      items={fields.map((f) => f.id)}
      filteredItems={shown.map((f) => f.id)}
      itemToStringLabel={(id: string) => fields.find((f) => f.id === id)?.label ?? id}
      value={null}
      onValueChange={(id) => {
        if (id) onPick(id);
      }}
      inputValue={query}
      onInputValueChange={(next) => setQuery(next)}
    >
      <div className="fg-fpop-head">
        <Combobox.Input
          ref={focus}
          className="fg-fpop-input"
          placeholder={placeholder}
          aria-label="Field"
        />
      </div>
      <Combobox.Empty className="fg-fpop-empty">No field</Combobox.Empty>
      <Combobox.List className="fg-pop-list">
        {(id: string) => {
          const field = fields.find((f) => f.id === id);
          if (!field) return null;
          const n = count(id);
          return (
            <Combobox.Item key={id} value={id} className="fg-pop-row">
              <Icon icon={field.icon} size={12} variant="mono" />
              <span className="fg-pop-label">{field.label}</span>
              {n > 0 ? <span className="fg-pop-hint">{n}</span> : null}
              <span className="fg-fpop-chev" aria-hidden="true">
                <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
              </span>
            </Combobox.Item>
          );
        }}
      </Combobox.List>
    </Combobox.Root>
  );
}

export interface ValueListProps {
  field: FilterField;
  values: ReadonlyArray<string>;
  onChange: (values: string[]) => void;
  /** Backspace in the empty input: goes back to the fields. */
  onBack?: () => void;
}

/** The values of one field, ticked several at once; the list stays open while they are ticked. */
export function ValueList({ field, values, onChange, onBack }: ValueListProps) {
  const [query, setQuery] = useState("");
  const focus = useFocusOnMount();
  const shown = useMemo(() => byLabel(field.options, query), [field.options, query]);
  const byValue = useMemo(
    () => new Map(field.options.map((o) => [o.value, o] as const)),
    [field.options],
  );
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && query === "" && onBack) {
      event.preventDefault();
      onBack();
    }
  };
  return (
    <Combobox.Root<string, true>
      inline
      open
      multiple
      autoHighlight
      items={field.options.map((o) => o.value)}
      filteredItems={shown.map((o) => o.value)}
      itemToStringLabel={(v: string) => byValue.get(v)?.label ?? v}
      value={[...values]}
      onValueChange={(next) => onChange(next)}
      inputValue={query}
      onInputValueChange={(next, details) => {
        if (!details.isItemPress) setQuery(next);
      }}
    >
      <div className="fg-fpop-head">
        <Combobox.Input
          ref={focus}
          className="fg-fpop-input"
          placeholder={`${field.label}…`}
          aria-label={field.label}
          onKeyDown={onKeyDown}
        />
      </div>
      <Combobox.Empty className="fg-fpop-empty">No match</Combobox.Empty>
      <Combobox.List className="fg-pop-list">
        {(v: string) => {
          const option: FilterOption | undefined = byValue.get(v);
          if (!option) return null;
          return (
            <Combobox.Item key={v} value={v} className="fg-pop-row">
              <span className="fg-check-box" aria-hidden="true">
                <Combobox.ItemIndicator>
                  <Icon icon={Tick02Icon} size={12} variant="mono" />
                </Combobox.ItemIndicator>
              </span>
              {option.glyph}
              <span className="fg-pop-label">{option.label}</span>
              {option.hint ? <span className="fg-pop-hint">{option.hint}</span> : null}
            </Combobox.Item>
          );
        }}
      </Combobox.List>
    </Combobox.Root>
  );
}
