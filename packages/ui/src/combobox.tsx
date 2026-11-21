// A typeahead (Combobox) and a field of typed-in tags (TagInput). The combobox takes its behaviour
// from Base UI (D-147): roles, the highlighted option, the popup and its placement; the look is ours.
// `Combobox` with `options` is the props-driven form; without, it is the root of shadcn-style parts
// (`ComboboxInput`, `ComboboxContent`, `ComboboxItem`…) and the props form is built from them (D-156).

import { Combobox as Base } from "@base-ui/react/combobox";
import { ArrowDown01Icon, Cancel01Icon, PlusSignIcon, Tick02Icon } from "@forgeron/icons";
import type { ClipboardEvent, ComponentProps, KeyboardEvent, ReactNode, RefObject } from "react";
import { createContext, useContext, useRef, useState } from "react";
import { asChildProps } from "./part";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

/* ---------------------------------------------------------------- parts (D-156) */

type Part<T> = Omit<T, "className"> & { className?: string };

/** `options` stays undefined: with options, `Combobox` is the props-driven one. */
export type ComboboxRootProps = ComponentProps<typeof Base.Root<any, any>> & {
  options?: undefined;
};

function ComboboxRoot({ options: _options, ...props }: ComboboxRootProps) {
  return <Base.Root {...props} />;
}

/** The chosen value, rendered by a function of it: `<ComboboxValue>{(v) => …}</ComboboxValue>`. */
export function ComboboxValue(props: ComponentProps<typeof Base.Value>) {
  return <Base.Value {...props} />;
}

/** The framed field around an input and its buttons (`ComboboxInput` makes it for you). */
export function ComboboxInputGroup({
  className,
  disabled,
  ...rest
}: Part<ComponentProps<typeof Base.InputGroup>> & { disabled?: boolean }) {
  return (
    <Base.InputGroup
      data-slot="combobox-input-group"
      {...rest}
      className={cx("fg-combo", disabled && "fg-combo-disabled", className)}
    />
  );
}

/** The text box, bare; inside `ComboboxInputGroup` or `ComboboxChips`. */
export function ComboboxChipsInput({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Input>>) {
  return (
    <Base.Input
      data-slot="combobox-chip-input"
      {...rest}
      className={cx("fg-combo-input", className)}
    />
  );
}

export type ComboboxInputProps = Part<ComponentProps<typeof Base.Input>> & {
  /** The caret button that opens the list. Default `true`. */
  showTrigger?: boolean;
  /** A button that clears the choice. Default `false`. */
  showClear?: boolean;
  /** On the frame around the text box. */
  groupClassName?: string;
};

/** The field: a text box with a caret and, if asked, a clear button, as in shadcn. */
export function ComboboxInput({
  showTrigger = true,
  showClear = false,
  groupClassName,
  disabled,
  className,
  children,
  ...rest
}: ComboboxInputProps) {
  return (
    <ComboboxInputGroup disabled={disabled} className={groupClassName}>
      <ComboboxChipsInput
        data-slot="combobox-input"
        {...rest}
        disabled={disabled}
        className={className}
      />
      {children}
      {showClear ? <ComboboxClear /> : null}
      {showTrigger ? <ComboboxTrigger /> : null}
    </ComboboxInputGroup>
  );
}

export type ComboboxTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & {
  asChild?: boolean;
};

/** The caret button; its children replace the caret. */
export function ComboboxTrigger({ asChild, className, children, ...rest }: ComboboxTriggerProps) {
  const inner = asChildProps(asChild, children);
  return (
    <Base.Trigger
      data-slot="combobox-trigger"
      {...rest}
      className={cx("fg-combo-btn fg-combo-caret", className)}
      {...("render" in inner ? inner : {})}
    >
      {"render" in inner
        ? undefined
        : (inner.children ?? <Icon icon={ArrowDown01Icon} size={12} variant="mono" />)}
    </Base.Trigger>
  );
}

/** A button that clears the choice; shown while there is one. */
export function ComboboxClear({
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof Base.Clear>>) {
  return (
    <Base.Clear data-slot="combobox-clear" {...rest} className={cx("fg-combo-btn", className)}>
      {children ?? <Icon icon={Cancel01Icon} size={12} variant="mono" />}
    </Base.Clear>
  );
}

/** For `multiple`: the chips and the text box, in one wrapping row. */
export function ComboboxChips({ className, ...rest }: Part<ComponentProps<typeof Base.Chips>>) {
  return (
    <Base.Chips data-slot="combobox-chips" {...rest} className={cx("fg-combo-chips", className)} />
  );
}

export type ComboboxChipProps = Part<ComponentProps<typeof Base.Chip>> & {
  /** The remove button. Default `true`. */
  showRemove?: boolean;
  /** Its `aria-label`; default “Remove”. */
  removeLabel?: string;
};

/** One chosen value of a `multiple` combobox, with its remove button. */
export function ComboboxChip({
  showRemove = true,
  removeLabel,
  className,
  children,
  ...rest
}: ComboboxChipProps) {
  return (
    <Base.Chip data-slot="combobox-chip" {...rest} className={cx("fg-combo-chip", className)}>
      {children}
      {showRemove ? (
        <Base.ChipRemove className="fg-combo-chip-x" aria-label={removeLabel ?? "Remove"}>
          <Icon icon={Cancel01Icon} size={12} variant="mono" />
        </Base.ChipRemove>
      ) : null}
    </Base.Chip>
  );
}

export type ComboboxContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** The popup under the field, in a portal: put `ComboboxEmpty` and `ComboboxList` in it. */
export function ComboboxContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
  ...rest
}: ComboboxContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner
        className="fg-pop-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <Base.Popup
          data-slot="combobox-content"
          {...rest}
          className={cx("fg-pop fg-combo-popup", className)}
        />
      </Base.Positioner>
    </Base.Portal>
  );
}

/** The options. Children are a function of the item when the root has `items`. */
export function ComboboxList({ className, ...rest }: Part<ComponentProps<typeof Base.List>>) {
  return <Base.List data-slot="combobox-list" {...rest} className={cx("fg-pop-list", className)} />;
}

/** Says so when nothing matches. */
export function ComboboxEmpty({ className, ...rest }: Part<ComponentProps<typeof Base.Empty>>) {
  return (
    <Base.Empty data-slot="combobox-empty" {...rest} className={cx("fg-combo-empty", className)} />
  );
}

/** A live line, e.g. “Loading…”. */
export function ComboboxStatus({ className, ...rest }: Part<ComponentProps<typeof Base.Status>>) {
  return (
    <Base.Status
      data-slot="combobox-status"
      {...rest}
      className={cx("fg-combo-status", className)}
    />
  );
}

export type ComboboxItemProps = Part<ComponentProps<typeof Base.Item>> & {
  /** Any mark before the text: an avatar, a swatch, a glyph. */
  glyph?: ReactNode;
  /** Mono text at the end of the row. */
  hint?: ReactNode;
  /** Anything after the hint: a chevron, a count. */
  trailing?: ReactNode;
  /** The tick of the chosen row. Default `true`. */
  indicator?: boolean;
};

/** One option; its children are its text. */
export function ComboboxItem({
  glyph,
  hint,
  trailing,
  indicator = true,
  className,
  children,
  ...rest
}: ComboboxItemProps) {
  return (
    <Base.Item data-slot="combobox-item" {...rest} className={cx("fg-pop-row", className)}>
      {glyph ?? null}
      <span className="fg-pop-label">{children}</span>
      {hint !== undefined && hint !== null ? <span className="fg-pop-hint">{hint}</span> : null}
      {trailing ?? null}
      {indicator ? (
        <Base.ItemIndicator className="fg-pop-tick">
          <Icon icon={Tick02Icon} size={12} variant="mono" />
        </Base.ItemIndicator>
      ) : null}
    </Base.Item>
  );
}

/** Shows its children only while its row is chosen: a checkbox's tick, in a row's `glyph`. */
export function ComboboxItemIndicator(props: ComponentProps<typeof Base.ItemIndicator>) {
  return <Base.ItemIndicator data-slot="combobox-item-indicator" {...props} />;
}

export function ComboboxGroup(props: ComponentProps<typeof Base.Group>) {
  return <Base.Group data-slot="combobox-group" {...props} />;
}

/** The name of a group, inside `ComboboxGroup`. */
export function ComboboxLabel({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.GroupLabel>>) {
  return (
    <Base.GroupLabel
      data-slot="combobox-label"
      {...rest}
      className={cx("fg-pop-heading", className)}
    />
  );
}

export function ComboboxSeparator({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Separator>>) {
  return (
    <Base.Separator
      data-slot="combobox-separator"
      {...rest}
      className={cx("fg-pop-sep", className)}
    />
  );
}

/** Renders the items of a group or of the list: `<ComboboxCollection>{(item) => …}`. */
export function ComboboxCollection(props: ComponentProps<typeof Base.Collection>) {
  return <Base.Collection {...props} />;
}

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

interface ComboboxShared extends Omit<
  ComponentProps<"div">,
  | "onChange"
  | "defaultValue"
  | "children"
  | "className"
  | "id"
  | "placeholder"
  | "aria-describedby"
  | "aria-invalid"
> {
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
export function Combobox(props: ComboboxProps | ComboboxRootProps) {
  return props.options !== undefined ? <PropsCombobox {...props} /> : <ComboboxRoot {...props} />;
}

function PropsCombobox(props: ComboboxProps) {
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
    // What the root part reads or the input takes by name; the rest goes on the frame.
    value: _value,
    defaultValue: _defaultValue,
    onChange: _onChange,
    multiple: _multiple,
    clearable: _clearable,
    "aria-describedby": _describedBy,
    "aria-invalid": _invalid,
    ...rest
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
    <ComboboxItem
      key={item.value}
      value={item}
      disabled={item.disabled}
      className={item.create !== undefined ? "fg-combo-create" : undefined}
      glyph={
        item.create !== undefined ? (
          <Icon icon={PlusSignIcon} size={12} variant="mono" />
        ) : (
          item.glyph
        )
      }
      hint={item.hint || undefined}
      indicator={item.create === undefined}
    >
      {item.label}
    </ComboboxItem>
  );

  const input = (
    <ComboboxChipsInput
      id={id}
      aria-label={label}
      aria-describedby={props["aria-describedby"]}
      aria-invalid={props["aria-invalid"]}
      placeholder={multiple && chosen.length > 0 ? "" : placeholder}
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
    <ComboboxRoot {...rootProps}>
      <ComboboxInputGroup data-slot="combobox" {...rest} disabled={disabled} className={className}>
        {multiple ? (
          <ComboboxChips aria-label={`${label}, chosen`}>
            {chosen.map((c) => (
              <ComboboxChip key={c.value} aria-label={c.label} removeLabel={`Remove ${c.label}`}>
                <span>{c.label}</span>
              </ComboboxChip>
            ))}
            {input}
          </ComboboxChips>
        ) : (
          input
        )}
        {props.clearable !== false && !multiple && selected.length > 0 ? (
          <ComboboxClear aria-label={`Clear ${label}`} />
        ) : null}
        <ComboboxTrigger aria-label={`Show ${label} options`} />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxStatus>{loading ? "Loading…" : null}</ComboboxStatus>
        <ComboboxEmpty>{loading ? "" : emptyText}</ComboboxEmpty>
        <ComboboxList>{(item: Item) => row(item)}</ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}

/* ---------------------------------------------------------------- TagInput */

/** The behaviour of a tag field, shared by its root and its parts. */
interface TagInputBehaviour {
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
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
}

export interface TagInputProps
  extends
    TagInputBehaviour,
    Omit<
      ComponentProps<"div">,
      | "onChange"
      | "defaultValue"
      | "className"
      | "id"
      | "children"
      | "aria-describedby"
      | "aria-invalid"
    > {
  /** Names the field for assistive technology. */
  label: string;
  placeholder?: string;
  id?: string;
  "aria-describedby"?: string | undefined;
  "aria-invalid"?: boolean | undefined;
  className?: string;
}

/** `label` stays undefined: with a label, `TagInput` is the props-driven one. */
export interface TagInputRootProps
  extends
    TagInputBehaviour,
    Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "className"> {
  label?: undefined;
  className?: string;
}

interface TagInputState {
  tags: string[];
  setTags: (tags: string[]) => void;
  draft: string;
  take: (raw: string, final: boolean) => void;
  input: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  full: boolean;
  validate: ((tag: string) => boolean) | undefined;
  separators: RegExp;
}

const TagInputContext = createContext<TagInputState | null>(null);

/** The tags, the draft and the actions of the enclosing `TagInput`. */
export function useTagInput(): TagInputState {
  const state = useContext(TagInputContext);
  if (!state) throw new Error("useTagInput must be used inside a TagInput");
  return state;
}

/**
 * Tags typed in: Enter or a separator ends one, a paste is split, Backspace removes the last. With
 * `label`, the props-driven field; without, the root of the parts (`TagInputList`, `TagInputTags`,
 * `TagInputTag`, `TagInputField`). It is free text, not a choice among options: for that, the
 * `ComboboxChips` parts.
 */
export function TagInput(props: TagInputProps | TagInputRootProps) {
  return props.label !== undefined ? (
    <PropsTagInput {...(props as TagInputProps)} />
  ) : (
    <TagInputRoot {...(props as TagInputRootProps)} />
  );
}

function PropsTagInput({ label, placeholder, id, className, ...props }: TagInputProps) {
  const { "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, ...rest } = props;
  return (
    <TagInputRoot {...rest} {...(className !== undefined ? { className } : {})}>
      <TagInputList aria-label={`${label}, added`}>
        <TagInputTags />
        <TagInputField
          id={id}
          aria-label={label}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          placeholder={placeholder}
        />
      </TagInputList>
    </TagInputRoot>
  );
}

function TagInputRoot({
  value,
  defaultValue = [],
  onChange,
  separators = /[\s,;]+/,
  validate,
  max,
  allowDuplicates = false,
  disabled = false,
  label: _label,
  className,
  onClick,
  ...rest
}: TagInputRootProps) {
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
    const left = final ? "" : (parts.pop() ?? "");
    add(parts);
    setDraft(left);
  };

  return (
    <TagInputContext.Provider
      value={{
        tags,
        setTags,
        draft,
        take,
        input,
        disabled,
        full: max !== undefined && tags.length >= max,
        validate,
        separators,
      }}
    >
      <div
        data-slot="tag-input"
        {...rest}
        className={cx("fg-combo fg-tagin", disabled && "fg-combo-disabled", className)}
        onClick={(event) => {
          onClick?.(event);
          if (event.target === event.currentTarget) input.current?.focus();
        }}
      />
    </TagInputContext.Provider>
  );
}

/** The row of tags and the field: `TagInputTags` and `TagInputField` go inside. */
export function TagInputList({ className, ...rest }: Part<ComponentProps<"ul">>) {
  return <ul data-slot="tag-input-list" {...rest} className={cx("fg-combo-chips", className)} />;
}

export interface TagInputTagProps extends Omit<Part<ComponentProps<"li">>, "value"> {
  value: string;
  /** The remove button's `aria-label`; default `Remove <tag>`. */
  removeLabel?: string;
}

/** One tag with its remove button, danger-toned when `validate` refuses it. */
export function TagInputTag({
  value,
  removeLabel,
  className,
  children,
  ...rest
}: TagInputTagProps) {
  const { tags, setTags, input, disabled, validate } = useTagInput();
  const bad = validate ? !validate(value) : false;
  return (
    <li
      data-slot="tag-input-tag"
      title={bad ? "Not valid" : undefined}
      {...rest}
      className={cx("fg-combo-chip", bad && "fg-combo-chip-bad", className)}
    >
      <span>{children ?? value}</span>
      {bad ? <span className="fg-sr">, not valid</span> : null}
      <button
        type="button"
        className="fg-combo-chip-x"
        aria-label={removeLabel ?? `Remove ${value}`}
        disabled={disabled}
        onClick={() => {
          setTags(tags.filter((t) => t !== value));
          input.current?.focus();
        }}
      >
        <Icon icon={Cancel01Icon} size={12} variant="mono" />
      </button>
    </li>
  );
}

/** Every tag of the field, as `TagInputTag`s; renders no element of its own. */
export function TagInputTags() {
  const { tags } = useTagInput();
  return (
    <>
      {tags.map((tag) => (
        <TagInputTag key={tag} value={tag} />
      ))}
    </>
  );
}

/** The text box where tags are typed: Enter or a separator ends one, a paste is split. */
export function TagInputField({
  className,
  placeholder,
  disabled,
  onKeyDown,
  onPaste,
  onBlur,
  ...rest
}: Part<ComponentProps<"input">>) {
  const { tags, setTags, draft, take, input, disabled: off, full, separators } = useTagInput();
  return (
    <li data-slot="tag-input-field-item" className="fg-tagin-item">
      <input
        ref={input}
        data-slot="tag-input-field"
        {...rest}
        className={cx("fg-combo-input", className)}
        placeholder={tags.length > 0 ? "" : placeholder}
        disabled={disabled || off || full}
        value={draft}
        onChange={(event) => take(event.target.value, false)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          onKeyDown?.(event);
          if (event.key === "Enter") {
            if (draft.trim()) {
              event.preventDefault();
              take(draft, true);
            }
          } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
            setTags(tags.slice(0, -1));
          }
        }}
        onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
          onPaste?.(event);
          const pasted = event.clipboardData.getData("text");
          if (!separators.test(pasted)) return;
          event.preventDefault();
          take(draft + pasted, true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (draft.trim()) take(draft, true);
        }}
      />
    </li>
  );
}
