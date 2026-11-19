// The box to write a message: a textarea with markdown markers (bold, italic, code, list on the
// keys and in a toolbar), `@` and `#` pickers at the caret, a slash hook, files, a preview, a reply
// bar, and a send key you choose. It extends the idea of CommentComposer (which stays as it is)
// for chat, mail, helpdesk and comments. The draft is `value` / `onChange`, or it keeps its own.

import {
  AtSignIcon,
  AttachmentIcon,
  BoldIcon,
  Cancel01Icon,
  CodeXmlIcon,
  HashIcon,
  ItalicIcon,
  LeftToRightListBulletIcon,
  MailSend01Icon,
  ViewIcon,
} from "@forgeron/icons";
import type { ChangeEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { FileInput, type FileInputProps } from "../file-input";
import { matchShortcut } from "../hooks/use-shortcuts";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { Markdown } from "../markdown";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "../toolbar";
import {
  applyConversationFormat,
  conversationMentionsToMarkdown,
  conversationPlainText,
  filterMentionOptions,
  findMentionTrigger,
  insertMention,
  parseMentions,
  type ActiveTrigger,
  type ConversationFormat,
  type ConversationQuote,
  type MentionOption,
  type ParsedMention,
} from "./conversation-model";
import {
  conversationCaretPosition,
  MentionPicker,
  mentionOptionId,
} from "./conversation-mention-picker";

export interface ComposerTrigger {
  /** The character that opens the picker: `@` for people, `#` for records, `/` for commands. */
  char: string;
  /** Names the list: "People". */
  label: string;
  options: ReadonlyArray<MentionOption>;
  /** Only at the start of a line (a command). */
  atLineStart?: boolean;
  /** `false` when `options` are already the answer to the query (a search on the server). */
  filter?: boolean;
  /** Says "Searching…" while the caller waits. */
  loading?: boolean;
  /** At most this many rows. Default 8. */
  limit?: number;
  /** Shown when nothing matches. */
  empty?: string;
}

export interface ComposerSend {
  /** The draft, trimmed, with its mentions as `@[Label](id)`. */
  text: string;
  attachments: File[];
  /** The mentions found in `text`. */
  mentions: ParsedMention[];
  /** The message being answered, when there is a reply bar. */
  replyToId: string | null;
}

export interface RichComposerProps {
  /** The draft, when the caller keeps it. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Files chosen, when the caller keeps them. */
  attachments?: File[];
  defaultAttachments?: File[];
  onAttachmentsChange?: (files: File[]) => void;
  /** Called on the send button and the send key; an empty draft with no file sends nothing. */
  onSend: (message: ComposerSend) => void;
  /** `mod-enter` (default): ⌘↵ sends, Enter is a new line. `enter`: Enter sends, ⇧↵ is a new line. */
  sendOn?: "mod-enter" | "enter";
  /** The pickers: people, records, commands. */
  triggers?: ReadonlyArray<ComposerTrigger>;
  /**
   * Hears the trigger the caret is in (`{ char, query }`), and `null` when it leaves. The hook to
   * load options from a server, or to run a slash command your own way.
   */
  onTrigger?: (state: { char: string; query: string } | null) => void;
  /** The message being answered: a bar above the box, with a cancel. */
  replyTo?: (ConversationQuote & { id: string }) | null;
  onCancelReply?: () => void;
  /** Called as the person types, to tell others ("is typing…"); throttle it yourself. */
  onTyping?: () => void;
  /** Names the box for assistive technology. Default "Message". */
  label?: string;
  placeholder?: string;
  /** The button. Default "Send". */
  sendLabel?: string;
  /** Show the formatting toolbar, the attach and the preview buttons. Default `true`. */
  toolbar?: boolean;
  /** The button that adds files, and the limits of `FileInput`. `false` removes it. */
  attachmentOptions?: false | Pick<FileInputProps, "accept" | "maxSize" | "maxFiles" | "onReject">;
  /** Rows the box grows to before it scrolls. Default 8. */
  maxRows?: number;
  disabled?: boolean;
  /** Shows the draft but does not take typing; says `readOnlyText`. */
  readOnly?: boolean;
  readOnlyText?: ReactNode;
  autoFocus?: boolean;
  className?: string;
}

const FORMAT_KEYS: ReadonlyArray<[string, ConversationFormat]> = [
  ["mod+b", "bold"],
  ["mod+i", "italic"],
  ["mod+e", "code"],
  ["mod+shift+l", "list"],
];

/** A box to write a message: markers, pickers, files, preview, a reply bar and your send key. */
export function RichComposer({
  value,
  defaultValue = "",
  onChange,
  attachments,
  defaultAttachments = [],
  onAttachmentsChange,
  onSend,
  sendOn = "mod-enter",
  triggers = [],
  onTrigger,
  replyTo = null,
  onCancelReply,
  onTyping,
  label = "Message",
  placeholder = "Write a message…",
  sendLabel = "Send",
  toolbar = true,
  attachmentOptions = {},
  maxRows = 8,
  disabled,
  readOnly,
  readOnlyText = "You can read this conversation but not write in it.",
  autoFocus,
  className,
}: RichComposerProps) {
  const id = useId();
  const [text, setText] = useControllableState<string>({ value, defaultValue, onChange });
  const [files, setFiles] = useControllableState<File[]>({
    value: attachments,
    defaultValue: defaultAttachments,
    onChange: onAttachmentsChange,
  });
  const area = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLFormElement>(null);
  const selection = useRef<[number, number] | null>(null);
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [cursor, setCursor] = useState<{ key: string; at: number }>({ key: "", at: 0 });
  const [preview, setPreview] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    below: boolean;
  } | null>(null);

  const locked = Boolean(disabled || readOnly);
  const canAttach = attachmentOptions !== false;
  const empty = text.trim() === "" && files.length === 0;

  const trigger: ActiveTrigger | null = useMemo(
    () =>
      focused && !locked && !preview
        ? findMentionTrigger(
            text,
            caret,
            triggers.map((t) => ({
              char: t.char,
              ...(t.atLineStart ? { atLineStart: true } : {}),
            })),
          )
        : null,
    [focused, locked, preview, text, caret, triggers],
  );
  const definition = trigger ? triggers.find((t) => t.char === trigger.char) : undefined;
  const options = useMemo(
    () =>
      trigger && definition
        ? definition.filter === false
          ? definition.options.slice(0, definition.limit ?? 8)
          : filterMentionOptions(definition.options, trigger.query, definition.limit ?? 8)
        : [],
    [trigger, definition],
  );
  const open = trigger !== null && definition !== undefined && dismissed !== trigger.start;
  // The highlighted row starts over whenever what was typed changes.
  const triggerKey = trigger ? `${trigger.char}${trigger.start}:${trigger.query}` : "";
  const index = cursor.key === triggerKey ? cursor.at : 0;
  const setIndex = (at: number) => setCursor({ key: triggerKey, at });
  const active = Math.min(index, Math.max(options.length - 1, 0));

  // The hook hears the trigger when it appears, changes or leaves.
  const heard = useRef("");
  useEffect(() => {
    if (triggerKey === heard.current) return;
    heard.current = triggerKey;
    onTrigger?.(trigger ? { char: trigger.char, query: trigger.query } : null);
  }, [trigger, triggerKey, onTrigger]);
  // A change made by code (a mention, a marker) puts the caret back where it belongs, and the box
  // grows with what it holds.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    if (selection.current) {
      el.setSelectionRange(...selection.current);
      selection.current = null;
    }
    const line = Number.parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.style.height = "auto";
    if (el.scrollHeight > 0)
      el.style.height = `${Math.min(el.scrollHeight, line * maxRows + 24)}px`;
  });

  const edit = (next: { text: string; start: number; end?: number }) => {
    selection.current = [next.start, next.end ?? next.start];
    setText(next.text);
    setCaret(next.end ?? next.start);
    area.current?.focus();
  };
  const format = (kind: ConversationFormat) => {
    const el = area.current;
    if (!el || locked) return;
    const next = applyConversationFormat(text, el.selectionStart, el.selectionEnd, kind);
    edit({ text: next.text, start: next.start, end: next.end });
  };
  const choose = (option: MentionOption) => {
    if (!trigger) return;
    const next = insertMention(text, trigger, option);
    edit({ text: next.text, start: next.caret });
  };
  const startTrigger = (char: string) => {
    const el = area.current;
    if (!el || locked) return;
    const at = el.selectionStart;
    const before = text.slice(0, at);
    const glue = before === "" || /\s$/.test(before) ? "" : " ";
    edit({ text: before + glue + char + text.slice(el.selectionEnd), start: at + glue.length + 1 });
    requestAnimationFrame(() => track(el));
  };

  const send = () => {
    if (locked || empty) return;
    const body = text.trim();
    onSend({
      text: body,
      attachments: files,
      mentions: parseMentions(body),
      replyToId: replyTo?.id ?? null,
    });
    if (value === undefined) setText("");
    if (attachments === undefined) setFiles([]);
    setPreview(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (open && options.length > 0) {
      const k = event.key;
      if (k === "ArrowDown" || k === "ArrowUp") {
        event.preventDefault();
        setIndex((active + (k === "ArrowDown" ? 1 : -1) + options.length) % options.length);
        return;
      }
      if ((k === "Enter" && !event.shiftKey) || k === "Tab") {
        event.preventDefault();
        choose(options[active]!);
        return;
      }
    }
    if (event.key === "Escape") {
      if (open && trigger) {
        event.preventDefault();
        setDismissed(trigger.start);
      } else if (replyTo && onCancelReply) {
        event.preventDefault();
        onCancelReply();
      }
      return;
    }
    for (const [combo, kind] of FORMAT_KEYS) {
      if (matchShortcut(event.nativeEvent, combo)) {
        event.preventDefault();
        format(kind);
        return;
      }
    }
    if (event.key === "Enter") {
      const mod = event.metaKey || event.ctrlKey;
      if (mod || (sendOn === "enter" && !event.shiftKey && !event.altKey)) {
        event.preventDefault();
        send();
      }
    }
  };

  const track = (el: HTMLTextAreaElement) => {
    // Any of these events means the box has the focus, even when it got it before React was ready.
    setFocused(true);
    setCaret(el.selectionStart);
    // Where the list opens: under the trigger character, measured when the caret moves.
    const found = findMentionTrigger(
      el.value,
      el.selectionStart,
      triggers.map((t) => ({ char: t.char, ...(t.atLineStart ? { atLineStart: true } : {}) })),
    );
    if (found) {
      const at = conversationCaretPosition(el, found.start);
      // Above the line unless the page has no room there for the list (about 240px).
      const below = el.getBoundingClientRect().top + at.top < 260;
      setPosition({
        top: el.offsetTop + at.top + (below ? at.height : 0),
        left: el.offsetLeft + at.left,
        below,
      });
    }
  };
  const change = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    track(event.target);
    onTyping?.();
  };

  const kbd = sendOn === "enter" ? "↵" : "⌘↵";
  const showAttach = canAttach && (attaching || files.length > 0);

  return (
    <form
      ref={root}
      className={cx("fg-conv-composer", locked && "fg-conv-composer-locked", className)}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {replyTo ? (
        <div className="fg-conv-replybar">
          <span className="fg-conv-replybar-text">
            Replying to <b>{replyTo.author}</b>
            <span className="fg-conv-replybar-quote">{conversationPlainText(replyTo.text)}</span>
          </span>
          {onCancelReply ? (
            <IconButton
              icon={Cancel01Icon}
              label="Cancel reply"
              size="sm"
              onClick={onCancelReply}
            />
          ) : null}
        </div>
      ) : null}
      {toolbar ? (
        <Toolbar label="Formatting" className="fg-conv-tools" disabled={locked}>
          <ToolbarButton label="Bold" icon={BoldIcon} onClick={() => format("bold")} />
          <ToolbarButton label="Italic" icon={ItalicIcon} onClick={() => format("italic")} />
          <ToolbarButton label="Code" icon={CodeXmlIcon} onClick={() => format("code")} />
          <ToolbarButton
            label="List"
            icon={LeftToRightListBulletIcon}
            onClick={() => format("list")}
          />
          {triggers.some((t) => t.char === "@") || triggers.some((t) => t.char === "#") ? (
            <ToolbarSeparator />
          ) : null}
          {triggers.some((t) => t.char === "@") ? (
            <ToolbarButton
              label="Mention someone"
              icon={AtSignIcon}
              onClick={() => startTrigger("@")}
            />
          ) : null}
          {triggers.some((t) => t.char === "#") ? (
            <ToolbarButton
              label="Reference a record"
              icon={HashIcon}
              onClick={() => startTrigger("#")}
            />
          ) : null}
          <ToolbarSeparator />
          {canAttach ? (
            <ToolbarButton
              label="Attach files"
              icon={AttachmentIcon}
              pressed={showAttach}
              onClick={() => setAttaching((v) => !v)}
            />
          ) : null}
          <ToolbarButton
            label="Preview"
            icon={ViewIcon}
            pressed={preview}
            onClick={() => setPreview((v) => !v)}
          />
        </Toolbar>
      ) : null}
      <div className="fg-conv-composer-field">
        <label htmlFor={`${id}-box`} className="fg-sr">
          {label}
        </label>
        {preview ? (
          <div className="fg-conv-preview" aria-label="Preview" role="region">
            {text.trim() ? (
              <Markdown source={conversationMentionsToMarkdown(text)} images={{}} />
            ) : (
              <p className="fg-conv-preview-empty">Nothing to preview.</p>
            )}
          </div>
        ) : null}
        <textarea
          ref={area}
          id={`${id}-box`}
          className="fg-conv-composer-input"
          hidden={preview}
          rows={2}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          aria-autocomplete={triggers.length > 0 ? "list" : undefined}
          {...(open && options.length > 0
            ? {
                "aria-controls": `${id}-pick`,
                "aria-activedescendant": mentionOptionId(`${id}-pick`, active),
              }
            : {})}
          onChange={change}
          onKeyDown={onKeyDown}
          onKeyUp={(event) => track(event.currentTarget)}
          onClick={(event) => track(event.currentTarget)}
          onSelect={(event) => track(event.currentTarget)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {open && definition && position ? (
          <MentionPicker
            id={`${id}-pick`}
            label={definition.label}
            options={options}
            activeIndex={active}
            onActiveIndexChange={setIndex}
            onSelect={choose}
            position={position}
            placement={position.below ? "below" : "above"}
            mark={definition.char}
            {...(definition.empty ? { empty: definition.empty } : {})}
            {...(definition.loading ? { loading: true } : {})}
          />
        ) : null}
      </div>
      {showAttach ? (
        <div className="fg-conv-composer-files">
          <FileInput
            label="Attachments"
            multiple
            value={files}
            onChange={setFiles}
            {...attachmentOptions}
          />
        </div>
      ) : null}
      <div className="fg-conv-composer-foot">
        <span className="fg-conv-composer-hint">
          {readOnly ? (
            readOnlyText
          ) : sendOn === "enter" ? (
            <>
              <b>↵</b> sends, <b>⇧↵</b> new line
            </>
          ) : (
            <>
              <b>⌘↵</b> sends
            </>
          )}
        </span>
        <Button type="submit" variant="primary" size="sm" kbd={kbd} disabled={locked || empty}>
          <Icon icon={MailSend01Icon} size={12} variant="mono" />
          {sendLabel}
        </Button>
      </div>
    </form>
  );
}
