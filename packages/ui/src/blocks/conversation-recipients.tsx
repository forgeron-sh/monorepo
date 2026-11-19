// The To, Cc and Bcc of a mail, or the people of any message to several: addresses as tags (Enter,
// comma, semicolon or a paste of many ends them), suggestions from your contacts as you type, a
// group that expands into its members, an address that is not valid marked in the danger tone and
// said. It wears the look of TagInput (the chips are the same); it has its own input because the
// list of suggestions needs the text typed.

import { Cancel01Icon, UserGroup03Icon } from "@forgeron/icons";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { useId, useMemo, useRef, useState } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import {
  addRecipients,
  conversationContactEmails,
  isEmailAddress,
  parseRecipientText,
  type ConversationContact,
} from "./conversation-model";

export interface RecipientInputProps {
  /** The field's name, written before it: "To", "Cc". */
  label: string;
  /** The addresses, as written. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** People and groups offered while typing; a group has `members`. */
  contacts?: ReadonlyArray<ConversationContact>;
  /** Marks an address that is not valid. Default `isEmailAddress`. */
  validate?: (address: string) => boolean;
  placeholder?: string;
  /** At most this many. */
  max?: number;
  disabled?: boolean;
  /** Hears what was added: a paste, a group (to say so, or to check the addresses on a server). */
  onAdd?: (added: string[]) => void;
  className?: string;
}

/** An address field with suggestions, groups, validity and paste. */
export function RecipientInput({
  label,
  value,
  defaultValue = [],
  onChange,
  contacts = [],
  validate = isEmailAddress,
  placeholder,
  max,
  disabled,
  onAdd,
  className,
}: RecipientInputProps) {
  const id = useId();
  const [tags, setTags] = useControllableState<string[]>({ value, defaultValue, onChange });
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState<Record<string, string>>({});

  const nameOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of contacts) if (c.email) map.set(c.email.toLowerCase(), c.name);
    return (address: string) => map.get(address.toLowerCase()) ?? pasted[address.toLowerCase()];
  }, [contacts, pasted]);

  const query = draft.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (query === "") return [];
    const have = new Set(tags.map((t) => t.toLowerCase()));
    return contacts
      .filter((c) => !(c.email && !c.members && have.has(c.email.toLowerCase())))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) || (c.email ?? "").toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [contacts, query, tags]);
  const shown = open && suggestions.length > 0;
  const active = Math.min(index, Math.max(suggestions.length - 1, 0));
  const room = (n: number) =>
    max === undefined
      ? n
      : Math.max(0, max - tags.length) >= n
        ? n
        : Math.max(0, max - tags.length);

  const add = (addresses: string[], note?: string) => {
    const next = addRecipients(tags, addresses.slice(0, room(addresses.length)));
    const added = next.slice(tags.length);
    if (added.length > 0) {
      setTags(next);
      onAdd?.(added);
    }
    setSaid(note ?? (added.length > 1 ? `${added.length} recipients added.` : ""));
  };
  const remember = (parsed: ReturnType<typeof parseRecipientText>) => {
    const named = parsed.filter((p) => p.name);
    if (named.length > 0) {
      setPasted((old) => ({
        ...old,
        ...Object.fromEntries(named.map((p) => [p.value.toLowerCase(), p.name!])),
      }));
    }
  };
  const commit = (raw = draft) => {
    const parsed = parseRecipientText(raw);
    remember(parsed);
    if (parsed.length > 0) add(parsed.map((p) => p.value));
    setDraft("");
    setOpen(false);
  };
  const choose = (contact: ConversationContact) => {
    const emails = conversationContactEmails(contact);
    add(emails, contact.members ? `${contact.name}: ${emails.length} recipients added.` : "");
    setDraft("");
    setOpen(false);
    input.current?.focus();
  };
  const remove = (address: string) => {
    setTags(tags.filter((t) => t !== address));
    input.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const k = event.key;
    if (shown && (k === "ArrowDown" || k === "ArrowUp")) {
      event.preventDefault();
      setIndex((active + (k === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length);
    } else if (k === "ArrowDown" && query !== "") {
      setOpen(true);
    } else if (k === "Enter" || k === "Tab") {
      if (shown) {
        event.preventDefault();
        choose(suggestions[active]!);
      } else if (draft.trim()) {
        event.preventDefault();
        commit();
      }
    } else if (k === "," || k === ";" || (k === " " && isEmailAddress(draft))) {
      if (draft.trim()) {
        event.preventDefault();
        commit();
      }
    } else if (k === "Escape" && shown) {
      event.preventDefault();
      setOpen(false);
    } else if (k === "Backspace" && draft === "" && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    if (!/[\s,;<]/.test(text.trim())) return;
    event.preventDefault();
    const parsed = parseRecipientText(draft + text);
    remember(parsed);
    const bad = parsed.filter((p) => !validate(p.value)).length;
    add(
      parsed.map((p) => p.value),
      `${parsed.length} recipient${parsed.length === 1 ? "" : "s"} pasted${bad ? `, ${bad} not valid` : ""}.`,
    );
    setDraft("");
  };

  return (
    <div className={cx("fg-conv-rcpt", disabled && "fg-combo-disabled", className)}>
      <span className="fg-conv-rcpt-label" id={`${id}-label`}>
        {label}
      </span>
      <div
        className="fg-combo fg-tagin fg-conv-rcpt-box"
        onClick={(event) => {
          if (event.target === event.currentTarget) input.current?.focus();
        }}
      >
        <ul className="fg-combo-chips" aria-label={`${label}, added`}>
          {tags.map((tag) => {
            const bad = !validate(tag);
            const name = nameOf(tag);
            return (
              <li
                key={tag}
                className={cx("fg-combo-chip", bad && "fg-combo-chip-bad")}
                title={bad ? "Not a valid address" : name ? tag : undefined}
              >
                <span>{name ?? tag}</span>
                {bad ? <span className="fg-sr">, not a valid address</span> : null}
                <button
                  type="button"
                  className="fg-combo-chip-x"
                  aria-label={`Remove ${name ?? tag}`}
                  disabled={disabled}
                  onClick={() => remove(tag)}
                >
                  <Icon icon={Cancel01Icon} size={12} variant="mono" />
                </button>
              </li>
            );
          })}
          <li className="fg-tagin-item">
            <input
              ref={input}
              className="fg-combo-input"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={shown}
              aria-controls={`${id}-list`}
              aria-labelledby={`${id}-label`}
              {...(shown ? { "aria-activedescendant": `${id}-opt-${active}` } : {})}
              placeholder={tags.length > 0 ? "" : placeholder}
              value={draft}
              disabled={disabled || (max !== undefined && tags.length >= max)}
              onChange={(event) => {
                setDraft(event.target.value);
                setOpen(true);
                setIndex(0);
              }}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onBlur={() => {
                setOpen(false);
                if (draft.trim()) commit();
              }}
            />
          </li>
        </ul>
        {shown ? (
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={`${label}, suggestions`}
            className="fg-conv-rcpt-list"
            onMouseDown={(event) => event.preventDefault()}
          >
            {suggestions.map((contact, i) => (
              <li
                key={contact.id}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className="fg-conv-mention-opt"
                onMouseMove={() => setIndex(i)}
                onClick={() => choose(contact)}
              >
                {contact.members ? (
                  <span className="fg-conv-mention-mark" aria-hidden="true">
                    <Icon icon={UserGroup03Icon} size={12} variant="mono" />
                  </span>
                ) : (
                  <Avatar
                    name={contact.name}
                    size={20}
                    {...(contact.avatar ? { src: contact.avatar } : {})}
                  />
                )}
                <span className="fg-conv-mention-label">{contact.name}</span>
                <span className="fg-conv-mention-hint">
                  {contact.members ? `${contact.members.length} people` : contact.email}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <span className="fg-sr" role="status" aria-live="polite">
        {said}
      </span>
    </div>
  );
}

export interface RecipientFieldsValue {
  to: string[];
  cc: string[];
  bcc: string[];
}

export interface RecipientFieldsProps {
  value?: RecipientFieldsValue;
  defaultValue?: RecipientFieldsValue;
  onChange?: (value: RecipientFieldsValue) => void;
  contacts?: ReadonlyArray<ConversationContact>;
  validate?: (address: string) => boolean;
  disabled?: boolean;
  /** The words for the three fields. Default To, Cc, Bcc. */
  labels?: { to?: string; cc?: string; bcc?: string };
  className?: string;
}

const NONE: RecipientFieldsValue = { to: [], cc: [], bcc: [] };

/** To, with Cc and Bcc revealed by two buttons (open from the start when they hold addresses). */
export function RecipientFields({
  value,
  defaultValue = NONE,
  onChange,
  contacts,
  validate,
  disabled,
  labels,
  className,
}: RecipientFieldsProps) {
  const [fields, setFields] = useControllableState<RecipientFieldsValue>({
    value,
    defaultValue,
    onChange,
  });
  const [showCc, setShowCc] = useState(fields.cc.length > 0);
  const [showBcc, setShowBcc] = useState(fields.bcc.length > 0);
  const words = { to: "To", cc: "Cc", bcc: "Bcc", ...labels };
  const shared = {
    ...(contacts ? { contacts } : {}),
    ...(validate ? { validate } : {}),
    ...(disabled ? { disabled } : {}),
  };
  return (
    <div className={cx("fg-conv-rcpts", className)}>
      <div className="fg-conv-rcpts-row">
        <RecipientInput
          label={words.to}
          value={fields.to}
          onChange={(to) => setFields({ ...fields, to })}
          {...shared}
        />
        <span className="fg-conv-rcpts-toggles">
          {!showCc ? (
            <button type="button" className="fg-conv-rcpts-toggle" onClick={() => setShowCc(true)}>
              {words.cc}
            </button>
          ) : null}
          {!showBcc ? (
            <button type="button" className="fg-conv-rcpts-toggle" onClick={() => setShowBcc(true)}>
              {words.bcc}
            </button>
          ) : null}
        </span>
      </div>
      {showCc ? (
        <RecipientInput
          label={words.cc}
          value={fields.cc}
          onChange={(cc) => setFields({ ...fields, cc })}
          {...shared}
        />
      ) : null}
      {showBcc ? (
        <RecipientInput
          label={words.bcc}
          value={fields.bcc}
          onChange={(bcc) => setFields({ ...fields, bcc })}
          {...shared}
        />
      ) : null}
    </div>
  );
}
