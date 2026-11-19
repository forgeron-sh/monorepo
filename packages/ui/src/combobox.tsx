// A typeahead (Combobox) and a field of typed-in tags (TagInput). The combobox takes its behaviour
// from Base UI (D-147): roles, the highlighted option, the popup and its placement; the look is ours.

import { Combobox as Base } from "@base-ui/react/combobox";
import { ArrowDown01Icon, Cancel01Icon, PlusSignIcon, Tick02Icon } from "@forgeron/icons";
import type { ClipboardEvent, KeyboardEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

/* ---------------------------------------------------------------- Combobox */

export interface ComboboxOption {
  value: string;
  label: string;
  /** Mono text at the end of the row: an address, a count. */
  hint?: string;
  /** Any mark before the label: an avatar, a swatch, a glyph. */
  glyph?: ReactNode;
  disabled?: boolean;
}

interface ComboboxShared {
  /** Names the control for assistive technology. */
  label: string;
  options: ReadonlyArray<ComboboxOption>;
  placeholder?: string;
  /**
   * Hears what is typed, on every key. For options that come from a server: ask, then pass the
   * answer as `options` (with `filter={false}`).
   */
  onInputChange?: (query: string) => void;
  /** `false` when `options` are already filtered by the caller (a search on the server). */
  filter?: boolean;
  /** Says so in the list while the caller waits for options. */
  loading?: boolean;
  /** Shown when no option matches. */
  emptyText?: string;
  /**
   * Makes the text typed a choice of its own: `onCreate(label)` returns the option to add (or
   * nothing, to use the text as both value and label). The row reads `Create “text”`.
   */
  onCreate?: (label: string) => ComboboxOption | void;
  createLabel?: (query: string) => string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
}

export interface ComboboxSingleProps extends ComboboxShared {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** A button that removes the choice. Default `true`. */
  clearable?: boolean;
}

export interface ComboboxMultipleProps extends ComboboxShared {
  /** Several choices, shown as chips before the text. */
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  clearable?: never;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

interface Item extends ComboboxOption {
  /** The text typed, on the row that creates it. */
  create?: string;
}

const text = (item: Item | null | undefined) => item?.label ?? "";
const same = (a: Item, b: Item) => a.value === b.value;
const contains = (item: Item, query: string) =>
  item.create !== undefined || item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase());

/**
 * Pick one or several among many by typing. Arrows move, Enter chooses, Escape closes; in multiple
 * mode Backspace removes the last chip. Options can come from a server (`onInputChange`, `loading`,
 * `filter={false}`) and the text typed can become an option (`onCreate`).
 */
export function Combobox(props: ComboboxProps) {
  const {
    label,
    options,
    placeholder,
    onInputChange,
    filter = true,
    loading,
    emptyText = "No match",
    onCreate,
    createLabel = (q) => `Create “${q}”`,
    disabled,
    id,
    className,
  } = props;
  const multiple = props.multiple === true;
  const [raw, setRaw] = useControllableState<string[] | string | null>({
    value: props.value as string[] | string | null | undefined,
    defaultValue: (props.defaultValue ?? (multiple ? [] : null)) as string[] | string | null,
    onChange: props.onChange as ((value: string[] | string | null) => void) | undefined,
  });
  const selected: string[] = multiple
    ? ((raw ?? []) as string[])
    : typeof raw === "string" && raw
      ? [raw]
      : [];
  const [query, setQuery] = useState("");
  // What was chosen stays known when the caller's options move on (a new search, a new page).
  const [cache, setCache] = useState<Item[]>([]);
  const [created, setCreated] = useState<Item[]>([]);
  const known = new Map<string, Item>([...cache, ...created, ...options].map((o) => [o.value, o]));
  const pool: Item[] = [
    ...options,
    ...created.filter((c) => !options.some((o) => o.value === c.value)),
  ];
  const trimmed = query.trim();
  const exact =
    trimmed !== "" &&
    (pool.some((o) => o.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase()) ||
      selected.some(
        (v) => known.get(v)?.label.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
      ));
  const items: Item[] =
    onCreate && trimmed && !exact
      ? [
          ...pool,
          { value: `\u0000create:${trimmed}`, label: createLabel(trimmed), create: trimmed },
        ]
      : pool;
  const itemOf = (v: string): Item => known.get(v) ?? { value: v, label: v };
  const chosen = selected.map(itemOf);

  const commit = (next: string[]) => setRaw(multiple ? next : (next[0] ?? null));
  const onValueChange = (next: unknown) => {
    const list = (Array.isArray(next) ? next : next ? [next] : []) as Item[];
    const make = list.find((i) => i.create !== undefined);
    if (make?.create !== undefined) {
      const made = onCreate?.(make.create) ?? { value: make.create, label: make.create };
      setCreated((c) => [...c.filter((x) => x.value !== made.value), made]);
      const rest = list.filter((i) => i.create === undefined).map((i) => i.value);
      commit(multiple ? [...rest, made.value] : [made.value]);
      return;
    }
    setCache((c) => [...c.filter((x) => !list.some((i) => i.value === x.value)), ...list]);
    commit(list.map((i) => i.value));
  };

  const row = (item: Item) => (
    <Base.Item
      key={item.value}
      value={item}
      disabled={item.disabled}
      className={cx("fg-pop-row", item.create !== undefined && "fg-combo-create")}
    >
      {item.create !== undefined ? (
        <Icon icon={PlusSignIcon} size={12} variant="mono" />
      ) : (
        (item.glyph ?? null)
      )}
      <span className="fg-pop-label">{item.label}</span>
      {item.hint ? <span className="fg-pop-hint">{item.hint}</span> : null}
      {item.create === undefined ? (
        <Base.ItemIndicator className="fg-pop-tick">
          <Icon icon={Tick02Icon} size={12} variant="mono" />
        </Base.ItemIndicator>
      ) : null}
    </Base.Item>
  );

  const input = (
    <Base.Input
      id={id}
      aria-label={label}
      aria-describedby={props["aria-describedby"]}
      aria-invalid={props["aria-invalid"]}
      placeholder={multiple && chosen.length > 0 ? "" : placeholder}
      className="fg-combo-input"
    />
  );

  // The root's props are the same for one or several choices; its types tell the two apart.
  const rootProps = {
    items,
    value: multiple ? chosen : (chosen[0] ?? null),
    onValueChange,
    multiple,
    disabled,
    filter: filter ? contains : null,
    itemToStringLabel: text,
    isItemEqualToValue: same,
    onInputValueChange: (v: string) => {
      setQuery(v);
      onInputChange?.(v);
    },
  } as unknown as Parameters<typeof Base.Root>[0];

  return (
    <Base.Root {...rootProps}>
      <Base.InputGroup className={cx("fg-combo", disabled && "fg-combo-disabled", className)}>
        {multiple ? (
          <Base.Chips className="fg-combo-chips" aria-label={`${label}, chosen`}>
            {chosen.map((c) => (
              <Base.Chip key={c.value} className="fg-combo-chip" aria-label={c.label}>
                <span>{c.label}</span>
                <Base.ChipRemove className="fg-combo-chip-x" aria-label={`Remove ${c.label}`}>
                  <Icon icon={Cancel01Icon} size={12} variant="mono" />
                </Base.ChipRemove>
              </Base.Chip>
            ))}
            {input}
          </Base.Chips>
        ) : (
          input
        )}
        {props.clearable !== false && !multiple && selected.length > 0 ? (
          <Base.Clear className="fg-combo-btn" aria-label={`Clear ${label}`}>
            <Icon icon={Cancel01Icon} size={12} variant="mono" />
          </Base.Clear>
        ) : null}
        <Base.Trigger className="fg-combo-btn fg-combo-caret" aria-label={`Show ${label} options`}>
          <Icon icon={ArrowDown01Icon} size={12} variant="mono" />
        </Base.Trigger>
      </Base.InputGroup>
      <Base.Portal>
        <Base.Positioner className="fg-pop-positioner" sideOffset={4} align="start">
          <Base.Popup className="fg-pop fg-combo-popup">
            <Base.Status className="fg-combo-status">{loading ? "Loading…" : null}</Base.Status>
            <Base.Empty className="fg-combo-empty">{loading ? "" : emptyText}</Base.Empty>
            <Base.List className="fg-pop-list">{(item: Item) => row(item)}</Base.List>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}

/* ---------------------------------------------------------------- TagInput */

export interface TagInputProps {
  /** Names the field for assistive technology. */
  label: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  /**
   * What ends a tag, in typed or pasted text. Default: a comma, a semicolon, a space or a new
   * line. Pass `/[,;\n]+/` for tags that hold spaces.
   */
  separators?: RegExp;
  /** Marks a tag that is not valid (danger tone, announced); it is kept all the same. */
  validate?: (tag: string) => boolean;
  /** At most this many tags. */
  max?: number;
  /** Lets the same tag in twice. Default `false`. */
  allowDuplicates?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
}

/** Tags typed in: Enter or a separator ends one, a paste is split, Backspace removes the last. */
export function TagInput({
  label,
  value,
  defaultValue = [],
  onChange,
  placeholder,
  separators = /[\s,;]+/,
  validate,
  max,
  allowDuplicates = false,
  disabled,
  id,
  className,
  ...aria
}: TagInputProps) {
  const [tags, setTags] = useControllableState<string[]>({ value, defaultValue, onChange });
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const add = (parts: string[]) => {
    let next = tags;
    for (const part of parts.map((p) => p.trim()).filter(Boolean)) {
      if (max !== undefined && next.length >= max) break;
      if (!allowDuplicates && next.includes(part)) continue;
      next = [...next, part];
    }
    if (next !== tags) setTags(next);
  };
  /** Commits every complete piece of `raw`; the last one stays in the field unless `final`. */
  const take = (raw: string, final: boolean) => {
    const parts = raw.split(separators);
    const rest = final ? "" : (parts.pop() ?? "");
    add(parts);
    setDraft(rest);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (draft.trim()) {
        event.preventDefault();
        take(draft, true);
      }
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!separators.test(pasted)) return;
    event.preventDefault();
    take(draft + pasted, true);
  };

  return (
    <div
      className={cx("fg-combo fg-tagin", disabled && "fg-combo-disabled", className)}
      onClick={(event) => {
        if (event.target === event.currentTarget) input.current?.focus();
      }}
    >
      <ul className="fg-combo-chips" aria-label={`${label}, added`}>
        {tags.map((tag) => {
          const bad = validate ? !validate(tag) : false;
          return (
            <li
              key={tag}
              className={cx("fg-combo-chip", bad && "fg-combo-chip-bad")}
              title={bad ? "Not valid" : undefined}
            >
              <span>{tag}</span>
              {bad ? <span className="fg-sr">, not valid</span> : null}
              <button
                type="button"
                className="fg-combo-chip-x"
                aria-label={`Remove ${tag}`}
                disabled={disabled}
                onClick={() => {
                  setTags(tags.filter((t) => t !== tag));
                  input.current?.focus();
                }}
              >
                <Icon icon={Cancel01Icon} size={12} variant="mono" />
              </button>
            </li>
          );
        })}
        <li className="fg-tagin-item">
          <input
            ref={input}
            id={id}
            {...aria}
            className="fg-combo-input"
            aria-label={label}
            placeholder={tags.length > 0 ? "" : placeholder}
            disabled={disabled || (max !== undefined && tags.length >= max)}
            value={draft}
            onChange={(event) => take(event.target.value, false)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => draft.trim() && take(draft, true)}
          />
        </li>
      </ul>
    </div>
  );
}
