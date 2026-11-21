// Two small marks of a live conversation: whether someone is there (a square, never a circle, and
// always a word for assistive technology) and who is writing (three squares that blink, still
// under reduced motion; the sentence is in a polite live region).
//
// Two ways to use each. With props, the usual mark. With children, a frame and its parts:
//
//   <PresenceDot status="online"><PresenceDotMark decorative /><PresenceDotLabel /></PresenceDot>
//   <TypingIndicator names={["Léa"]}><TypingIndicatorDots /><TypingIndicatorText /></TypingIndicator>

import { createContext, useContext, type ReactNode } from "react";
import { cx } from "../cx";
import { conversationTypingLabel } from "./conversation-model";
import { part, type PartProps } from "../part";

export type PresenceStatus = "online" | "away" | "busy" | "offline";

const PRESENCE_WORDS: Readonly<Record<PresenceStatus, string>> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
};

interface PresenceContext {
  status: PresenceStatus;
  word: string;
}
const PresenceCtx = createContext<PresenceContext | null>(null);

function usePresence(name: string): PresenceContext {
  const ctx = useContext(PresenceCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <PresenceDot>.`);
  return ctx;
}

export interface PresenceDotProps extends Omit<PartProps<"span">, "children"> {
  status: PresenceStatus;
  /** Another word than "Online", "Away", "Busy", "Offline". */
  label?: string;
  /** Writes the word next to the square. */
  showLabel?: boolean;
  /** The parts (`PresenceDotMark`, `PresenceDotLabel`): the frame around them. */
  children?: ReactNode;
}

/** The square of a presence: `role="img"` and the word, or hidden when `decorative`. */
export function PresenceDotMark({
  decorative,
  className,
  ...rest
}: PartProps<"span"> & { decorative?: boolean }) {
  const { status, word } = usePresence("PresenceDotMark");
  return part(
    "span",
    "presence-dot-mark",
    `fg-conv-presence fg-conv-presence-${status}`,
    { className, ...rest },
    decorative ? { "aria-hidden": true } : { role: "img", "aria-label": word },
  );
}

/** The word of a presence, written. */
export function PresenceDotLabel({ children, ...rest }: PartProps<"span">) {
  const { word } = usePresence("PresenceDotLabel");
  return part("span", "presence-dot-label", undefined, { ...rest, children: children ?? word });
}

/** A 8px square: green online, yellow away, red busy, a hollow one offline. The state is also a word. */
export function PresenceDot({
  status,
  label,
  showLabel,
  children,
  className,
  asChild,
  ...rest
}: PresenceDotProps) {
  const word = label ?? PRESENCE_WORDS[status];
  const ctx = { status, word };
  if (children !== undefined) {
    return (
      <PresenceCtx.Provider value={ctx}>
        {part("span", "presence-dot", "fg-conv-presence-with", {
          className,
          asChild,
          ...rest,
          children,
        })}
      </PresenceCtx.Provider>
    );
  }
  if (!showLabel) {
    return (
      <PresenceCtx.Provider value={ctx}>
        <PresenceDotMark {...rest} {...(className ? { className } : {})} />
      </PresenceCtx.Provider>
    );
  }
  return (
    <PresenceCtx.Provider value={ctx}>
      {part("span", "presence-dot", "fg-conv-presence-with", {
        className,
        asChild,
        ...rest,
        children: (
          <>
            <PresenceDotMark decorative />
            <PresenceDotLabel />
          </>
        ),
      })}
    </PresenceCtx.Provider>
  );
}

/* ---------------------------------------------------------------- typing */

const TypingCtx = createContext<string | null>(null);

export interface TypingIndicatorProps extends Omit<PartProps<"div">, "children"> {
  /** Who is writing. Empty: nothing is shown and nothing is said. */
  names: ReadonlyArray<string>;
  /** Names written before "and n others". Default 2. */
  shown?: number;
  /** Keeps the line's height when nobody is typing, so the list does not jump. Default `true`. */
  reserve?: boolean;
  /** The parts (`TypingIndicatorDots`, `TypingIndicatorText`); shown only while someone types. */
  children?: ReactNode;
}

/** The three blinking squares. */
export function TypingIndicatorDots(props: PartProps<"span">) {
  return part(
    "span",
    "typing-indicator-dots",
    "fg-conv-typing-dots",
    { ...props, children: props.children ?? [<i key="a" />, <i key="b" />, <i key="c" />] },
    { "aria-hidden": "true" },
  );
}

/** The sentence: "Léa is typing…". */
export function TypingIndicatorText({ children, ...rest }: PartProps<"span">) {
  const text = useContext(TypingCtx);
  return part("span", "typing-indicator-text", undefined, { ...rest, children: children ?? text });
}

/** "Léa is typing…" with three blinking squares, announced politely when it appears. */
export function TypingIndicator({
  names,
  shown = 2,
  reserve = true,
  children,
  className,
  asChild,
  ...rest
}: TypingIndicatorProps) {
  const text = conversationTypingLabel(names, shown);
  return (
    <TypingCtx.Provider value={text}>
      {part(
        "div",
        "typing-indicator",
        cx("fg-conv-typing", !text && !reserve && "fg-conv-typing-none"),
        {
          className,
          asChild,
          ...rest,
          children: text
            ? (children ?? (
                <>
                  <TypingIndicatorDots />
                  <TypingIndicatorText />
                </>
              ))
            : null,
        },
        { role: "status", "aria-live": "polite", "aria-atomic": "true" },
      )}
    </TypingCtx.Provider>
  );
}
