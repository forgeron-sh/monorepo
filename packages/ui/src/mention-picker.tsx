// The list that opens under a trigger typed in a text box (@ for people, # for records, / for
// commands). It never takes the focus: the box keeps it and points at the active row with
// aria-activedescendant, so the person keeps typing; the caller moves the active row with the arrows
// and chooses with Enter or Tab. A click chooses too.

import { useEffect, useRef } from "react";
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

/** A listbox of options at the caret: avatar or mark, the label, a hint. Presentational. */
export function MentionPicker({
  options,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  id,
  label,
  empty = "No match",
  loading,
  position,
  placement = "above",
  mark,
  className,
}: MentionPickerProps) {
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    list.current?.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);
  return (
    <div
      className={cx("fg-conv-mention-pop", position && "fg-conv-mention-pop-at", className)}
      data-placement={placement}
      style={position ? { top: position.top, left: position.left } : undefined}
      // The box keeps the focus: a press on the list must not blur it.
      onMouseDown={(event) => event.preventDefault()}
    >
      <ul ref={list} id={id} role="listbox" aria-label={label} className="fg-conv-mention-list">
        {options.map((option, index) => (
          <li
            key={option.id}
            id={mentionOptionId(id, index)}
            role="option"
            aria-selected={index === activeIndex}
            className="fg-conv-mention-opt"
            onMouseMove={() => index !== activeIndex && onActiveIndexChange?.(index)}
            onClick={() => onSelect(option)}
          >
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
          </li>
        ))}
      </ul>
      {options.length === 0 ? (
        <p className="fg-conv-mention-empty" role="status">
          {loading ? "Searching…" : empty}
        </p>
      ) : null}
    </div>
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
