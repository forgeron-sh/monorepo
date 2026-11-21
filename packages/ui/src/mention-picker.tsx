// The list that opens under a trigger typed in a text box (@ for people, # for records, / for
// commands). It never takes the focus: the box keeps it and points at the active row with
// aria-activedescendant, so the person keeps typing; the caller moves the active row with the arrows
// and chooses with Enter or Tab. A click chooses too.

import { createContext, useContext, useEffect, useRef, type ComponentProps } from "react";
import { Avatar } from "./avatar";
import { cx } from "./cx";
import { conversationPlainText, type MentionOption } from "./composer-model";

/** The id of option `index` of a picker with this `id`: for the box's `aria-activedescendant`. */
export const mentionOptionId = (id: string, index: number) => `${id}-opt-${index}`;

export interface MentionPickerProps {
  options: ReadonlyArray<MentionOption>;
  /** The highlighted row. */
  activeIndex: number;
  onActiveIndexChange?: (index: number) => void;
  onSelect: (option: MentionOption) => void;
  /** Ties the list to its text box: `aria-controls={id}`, `aria-activedescendant={mentionOptionId(id, i)}`. */
  id: string;
  /** Names the list: "People". */
  label: string;
  /** Shown when nothing matches. */
  empty?: string;
  /** Says "Searching…" instead of the list while the caller waits. */
  loading?: boolean;
  /** Where the list sits in its positioned parent, in px (the caret: `conversationCaretPosition`). */
  position?: { top: number; left: number };
  /** On which side of `position` it opens. Default `above`. */
  placement?: "above" | "below";
  /** Shows the trigger character before each label (`@`, `#`). */
  mark?: string;
  className?: string;
}

/** `options` stays undefined: with options, `MentionPicker` is the props-driven one. */
export type MentionPickerRootProps = Omit<ComponentProps<"div">, "id" | "onSelect"> & {
  options?: undefined;
  activeIndex: number;
  onActiveIndexChange?: (index: number) => void;
  /** Called by `MentionPickerItem` on a click. */
  onSelect?: (option: MentionOption) => void;
  id: string;
  position?: { top: number; left: number };
  placement?: "above" | "below";
  /** The trigger character the default rows show (`@`, `#`). */
  mark?: string;
};

interface PickerState {
  id: string;
  activeIndex: number;
  onActiveIndexChange: ((index: number) => void) | undefined;
  onSelect: ((option: MentionOption) => void) | undefined;
  mark: string | undefined;
}

const PickerContext = createContext<PickerState | null>(null);

function usePicker(): PickerState {
  const state = useContext(PickerContext);
  if (!state) throw new Error("MentionPicker parts go inside <MentionPicker>.");
  return state;
}

/**
 * A listbox of options at the caret: avatar or mark, the label, a hint. Presentational: the box
 * keeps the focus, the caller moves `activeIndex`. With `options`, the whole list; without, the
 * root of `MentionPickerList`, `MentionPickerItem` and `MentionPickerEmpty`.
 *
 * It is not built on `Combobox` or `Command`: both own their text input and their highlighted
 * row, and here both belong to the caller's text box.
 */
export function MentionPicker(props: MentionPickerProps | MentionPickerRootProps) {
  return props.options !== undefined ? (
    <MentionPickerOptions {...(props as MentionPickerProps)} />
  ) : (
    <MentionPickerRoot {...(props as MentionPickerRootProps)} />
  );
}

function MentionPickerRoot({
  options: _options,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  id,
  position,
  placement = "above",
  mark,
  className,
  style,
  ...rest
}: MentionPickerRootProps) {
  return (
    <PickerContext.Provider value={{ id, activeIndex, onActiveIndexChange, onSelect, mark }}>
      <div
        data-slot="mention-picker"
        {...rest}
        className={cx("fg-conv-mention-pop", position && "fg-conv-mention-pop-at", className)}
        data-placement={placement}
        style={position ? { top: position.top, left: position.left, ...style } : style}
        // The box keeps the focus: a press on the list must not blur it.
        onMouseDown={(event) => {
          rest.onMouseDown?.(event);
          event.preventDefault();
        }}
      />
    </PickerContext.Provider>
  );
}

/** The listbox, scrolling; it keeps the highlighted row in view. */
export function MentionPickerList({
  label,
  className,
  ...rest
}: Omit<ComponentProps<"ul">, "id"> & { label?: string }) {
  const { id, activeIndex } = usePicker();
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    list.current?.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);
  return (
    <ul
      ref={list}
      data-slot="mention-picker-list"
      role="listbox"
      aria-label={label}
      {...rest}
      id={id}
      className={cx("fg-conv-mention-list", className)}
    />
  );
}

export type MentionPickerItemProps = Omit<ComponentProps<"li">, "id" | "onSelect"> & {
  option: MentionOption;
  /** The row's place in the list: what `activeIndex` points at. */
  index: number;
};

/** One row. Its children replace the default avatar or mark, label and hint. */
export function MentionPickerItem({
  option,
  index,
  className,
  children,
  onClick,
  onMouseMove,
  ...rest
}: MentionPickerItemProps) {
  const { id, activeIndex, onActiveIndexChange, onSelect, mark } = usePicker();
  return (
    <li
      data-slot="mention-picker-item"
      {...rest}
      id={mentionOptionId(id, index)}
      role="option"
      aria-selected={index === activeIndex}
      className={cx("fg-conv-mention-opt", className)}
      onMouseMove={(event) => {
        onMouseMove?.(event);
        if (index !== activeIndex) onActiveIndexChange?.(index);
      }}
      onClick={(event) => {
        onClick?.(event);
        onSelect?.(option);
      }}
    >
      {children ?? (
        <>
          {option.avatar !== undefined || mark === "@" ? (
            <Avatar
              name={option.label}
              size={20}
              {...(option.avatar ? { src: option.avatar } : {})}
            />
          ) : mark ? (
            <span className="fg-conv-mention-mark" aria-hidden="true">
              {mark}
            </span>
          ) : null}
          <span className="fg-conv-mention-label">{conversationPlainText(option.label)}</span>
          {option.hint ? <span className="fg-conv-mention-hint">{option.hint}</span> : null}
        </>
      )}
    </li>
  );
}

/** What shows when nothing matches. */
export function MentionPickerEmpty({ className, ...rest }: ComponentProps<"p">) {
  return (
    <p
      data-slot="mention-picker-empty"
      role="status"
      {...rest}
      className={cx("fg-conv-mention-empty", className)}
    />
  );
}

function MentionPickerOptions({
  options,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  id,
  label,
  empty = "No match",
  loading,
  position,
  placement,
  mark,
  className,
}: MentionPickerProps) {
  return (
    <MentionPickerRoot
      activeIndex={activeIndex}
      onActiveIndexChange={onActiveIndexChange}
      onSelect={onSelect}
      id={id}
      position={position}
      placement={placement}
      mark={mark}
      className={className}
    >
      <MentionPickerList label={label}>
        {options.map((option, index) => (
          <MentionPickerItem key={option.id} option={option} index={index} />
        ))}
      </MentionPickerList>
      {options.length === 0 ? (
        <MentionPickerEmpty>{loading ? "Searching…" : empty}</MentionPickerEmpty>
      ) : null}
    </MentionPickerRoot>
  );
}

const MIRRORED = [
  "boxSizing",
  "width",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "letterSpacing",
  "textTransform",
  "textIndent",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
  "tabSize",
] as const;

/**
 * Where the character at `index` of a textarea is, in px from the textarea's top left corner (its
 * scroll taken off): measured on a hidden copy of the box. For the position of a `MentionPicker`.
 */
export function conversationCaretPosition(
  textarea: HTMLTextAreaElement,
  index: number,
): { top: number; left: number; height: number } {
  const mirror = document.createElement("div");
  const style = getComputedStyle(textarea);
  for (const key of MIRRORED) mirror.style[key] = style[key];
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.textContent = textarea.value.slice(0, index);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(index) || ".";
  mirror.append(marker);
  document.body.append(mirror);
  const height =
    Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.4 || 20;
  const result = {
    top: marker.offsetTop - textarea.scrollTop,
    left: marker.offsetLeft - textarea.scrollLeft,
    height,
  };
  mirror.remove();
  return result;
}
