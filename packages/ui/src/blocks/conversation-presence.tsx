// Two small marks of a live conversation: whether someone is there (a square, never a circle, and
// always a word for assistive technology) and who is writing (three squares that blink, still
// under reduced motion; the sentence is in a polite live region).

import { cx } from "../cx";
import { conversationTypingLabel } from "./conversation-model";

export type PresenceStatus = "online" | "away" | "busy" | "offline";

const PRESENCE_WORDS: Readonly<Record<PresenceStatus, string>> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
};

export interface PresenceDotProps {
  status: PresenceStatus;
  /** Another word than "Online", "Away", "Busy", "Offline". */
  label?: string;
  /** Writes the word next to the square. */
  showLabel?: boolean;
  className?: string;
}

/** A 8px square: green online, yellow away, red busy, a hollow one offline. The state is also a word. */
export function PresenceDot({ status, label, showLabel, className }: PresenceDotProps) {
  const word = label ?? PRESENCE_WORDS[status];
  const dot = (
    <span
      className={cx("fg-conv-presence", `fg-conv-presence-${status}`, !showLabel && className)}
      {...(showLabel ? { "aria-hidden": true } : { role: "img", "aria-label": word })}
    />
  );
  if (!showLabel) return dot;
  return (
    <span className={cx("fg-conv-presence-with", className)}>
      {dot}
      <span>{word}</span>
    </span>
  );
}

export interface TypingIndicatorProps {
  /** Who is writing. Empty: nothing is shown and nothing is said. */
  names: ReadonlyArray<string>;
  /** Names written before "and n others". Default 2. */
  shown?: number;
  /** Keeps the line's height when nobody is typing, so the list does not jump. Default `true`. */
  reserve?: boolean;
  className?: string;
}

/** "Léa is typing…" with three blinking squares, announced politely when it appears. */
export function TypingIndicator({
  names,
  shown = 2,
  reserve = true,
  className,
}: TypingIndicatorProps) {
  const text = conversationTypingLabel(names, shown);
  return (
    <div
      className={cx("fg-conv-typing", !text && !reserve && "fg-conv-typing-none", className)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {text ? (
        <>
          <span className="fg-conv-typing-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>{text}</span>
        </>
      ) : null}
    </div>
  );
}
