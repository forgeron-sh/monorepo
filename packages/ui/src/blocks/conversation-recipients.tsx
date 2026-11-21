// The To, Cc and Bcc of a mail, or the people of any message to several: addresses as tags (Enter,
// comma, semicolon or a paste of many ends them), suggestions from your contacts as you type, a
// group that expands into its members, an address that is not valid marked in the danger tone and
// said. The chips, the text box and the list of suggestions are the Combobox parts (several
// choices, the list filtered here); the block adds the typing of free addresses and the paste.
//
// With props it is the usual field. With children it is a frame, and the parts compose it:
//
//   <RecipientInput label="To" contacts={contacts}>
//     <RecipientInputLabel />
//     <RecipientInputField><RecipientInputBox /><RecipientInputSuggestions /></RecipientInputField>
//     <RecipientInputStatus />
//   </RecipientInput>
//
// RecipientFields is To with Cc and Bcc: `RecipientFieldsRow`, `RecipientFieldsInput` (`name`),
// `RecipientFieldsToggles`.

import { UserGroup03Icon } from "@forgeron/icons";
import type { ClipboardEvent, KeyboardEvent, ReactNode, RefObject } from "react";
import { createContext, useContext, useId, useMemo, useRef, useState } from "react";
import { Avatar } from "../avatar";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
} from "../combobox";
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
import { part, type PartProps } from "../part";

export interface RecipientInputProps extends Omit<
  PartProps<"div">,
  "children" | "onChange" | "defaultValue" | "placeholder"
> {
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
  /** The parts (`RecipientInputLabel`, `RecipientInputField`…). Without them, the field is built from the props. */
  children?: ReactNode;
}

interface FieldContext {
  id: string;
  label: string;
  tags: string[];
  contacts: ReadonlyArray<ConversationContact>;
  suggestions: ConversationContact[];
  validate: (address: string) => boolean;
  placeholder: string | undefined;
  max: number | undefined;
  disabled: boolean | undefined;
  draft: string;
  setDraft: (draft: string) => void;
  setTags: (tags: string[]) => void;
  setOpen: (open: boolean) => void;
  highlight: (contact: ConversationContact | undefined) => void;
  said: string;
  nameOf: (address: string) => string | undefined;
  choose: (contact: ConversationContact) => void;
  commit: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
}
const FieldCtx = createContext<FieldContext | null>(null);
const InputRefCtx = createContext<RefObject<HTMLInputElement | null> | null>(null);

function useField(name: string): FieldContext {
  const ctx = useContext(FieldCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <RecipientInput>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The field's name, written before it: "To", "Cc". */
export function RecipientInputLabel({ children, ...rest }: PartProps<"span">) {
  const { id, label } = useField("RecipientInputLabel");
  return part(
    "span",
    "recipient-input-label",
    "fg-conv-rcpt-label",
    { ...rest, children: children ?? label },
    { id: `${id}-label` },
  );
}

/** The Combobox: its state is the field's. Put the box and the suggestions in it. */
export function RecipientInputField({ children }: { children?: ReactNode }) {
  const f = useField("RecipientInputField");
  return (
    <Combobox
      multiple
      autoHighlight
      filter={null}
      items={f.suggestions}
      value={f.tags}
      disabled={f.disabled}
      itemToStringLabel={(contact: ConversationContact | string) =>
        typeof contact === "string" ? contact : contact.name
      }
      onValueChange={(next: Array<ConversationContact | string>) => {
        const picked = next.find((v): v is ConversationContact => typeof v !== "string");
        if (picked) f.choose(picked);
        else f.setTags(next as string[]);
      }}
      inputValue={f.draft}
      onInputValueChange={(next: string) => f.setDraft(next)}
      onOpenChange={(next: boolean) => f.setOpen(next)}
      onItemHighlighted={(contact: ConversationContact | undefined) => {
        f.highlight(contact);
      }}
    >
      {children}
    </Combobox>
  );
}

/** The box: the chips of the addresses and the text field. */
export function RecipientInputBox({ className }: { className?: string }) {
  const f = useField("RecipientInputBox");
  const inputRef = useContext(InputRefCtx);
  const focusInput = (event: { target: unknown; currentTarget: unknown }) => {
    if (event.target === event.currentTarget) inputRef?.current?.focus();
  };
  return (
    <ComboboxInputGroup
      data-slot="recipient-input-box"
      disabled={f.disabled}
      className={cx("fg-conv-rcpt-box", className)}
      onClick={focusInput}
    >
      <ComboboxChips aria-label={`${f.label}, added`} onClick={focusInput}>
        {f.tags.map((tag) => {
          const bad = !f.validate(tag);
          const name = f.nameOf(tag);
          return (
            <ComboboxChip
              key={tag}
              className={bad ? "fg-combo-chip-bad" : undefined}
              title={bad ? "Not a valid address" : name ? tag : undefined}
              removeLabel={`Remove ${name ?? tag}`}
            >
              <span>{name ?? tag}</span>
              {bad ? <span className="fg-sr">, not a valid address</span> : null}
            </ComboboxChip>
          );
        })}
        <ComboboxChipsInput
          ref={inputRef}
          aria-labelledby={`${f.id}-label`}
          placeholder={f.tags.length > 0 ? "" : f.placeholder}
          disabled={f.disabled || (f.max !== undefined && f.tags.length >= f.max)}
          onKeyDown={f.onKeyDown}
          onPaste={f.onPaste}
          onBlur={() => {
            if (f.draft.trim()) f.commit();
          }}
        />
      </ComboboxChips>
    </ComboboxInputGroup>
  );
}

/** The list of suggestions: people, and groups that expand into their members. */
export function RecipientInputSuggestions() {
  const { label } = useField("RecipientInputSuggestions");
  return (
    <ComboboxContent>
      <ComboboxList aria-label={`${label}, suggestions`}>
        {(contact: ConversationContact) => (
          <ComboboxItem
            key={contact.id}
            value={contact}
            indicator={false}
            glyph={
              contact.members ? (
                <span className="fg-conv-mention-mark" aria-hidden="true">
                  <Icon icon={UserGroup03Icon} size={12} variant="mono" />
                </span>
              ) : (
                <Avatar
                  name={contact.name}
                  size={20}
                  {...(contact.avatar ? { src: contact.avatar } : {})}
                />
              )
            }
            hint={contact.members ? `${contact.members.length} people` : contact.email}
          >
            {contact.name}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  );
}

/** The polite line that says "3 recipients added.". */
export function RecipientInputStatus(props: PartProps<"span">) {
  const { said } = useField("RecipientInputStatus");
  return part(
    "span",
    "recipient-input-status",
    "fg-sr",
    { ...props, children: props.children ?? said },
    { role: "status", "aria-live": "polite" },
  );
}

/* ---------------------------------------------------------------- the field */

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
  children,
  className,
  asChild,
  ...rest
}: RecipientInputProps) {
  const id = useId();
  const [tags, setTags] = useControllableState<string[]>({ value, defaultValue, onChange });
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const highlighted = useRef<ConversationContact | undefined>(undefined);
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
  };
  const choose = (contact: ConversationContact) => {
    const emails = conversationContactEmails(contact);
    add(emails, contact.members ? `${contact.name}: ${emails.length} recipients added.` : "");
    setDraft("");
  };

  // Arrows, Enter on a suggestion and Backspace on the chips are the combobox's; this is the rest.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const k = event.key;
    if (k === "Tab" && shown && highlighted.current) {
      event.preventDefault();
      choose(highlighted.current);
    } else if ((k === "Enter" || k === "Tab") && !shown) {
      if (draft.trim()) {
        event.preventDefault();
        commit();
      }
    } else if (k === "," || k === ";" || (k === " " && isEmailAddress(draft))) {
      if (draft.trim()) {
        event.preventDefault();
        commit();
      }
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

  const ctx: FieldContext = {
    id,
    label,
    tags,
    contacts,
    suggestions,
    validate,
    placeholder,
    max,
    disabled,
    draft,
    setDraft,
    setTags,
    setOpen,
    highlight: (contact) => {
      highlighted.current = contact;
    },
    said,
    nameOf,
    choose,
    commit,
    onKeyDown,
    onPaste,
  };
  return (
    <FieldCtx.Provider value={ctx}>
      <InputRefCtx.Provider value={input}>
        {part("div", "recipient-input", cx("fg-conv-rcpt", disabled && "fg-combo-disabled"), {
          className,
          asChild,
          ...rest,
          children: children ?? (
            <>
              <RecipientInputLabel />
              <RecipientInputField>
                <RecipientInputBox />
                <RecipientInputSuggestions />
              </RecipientInputField>
              <RecipientInputStatus />
            </>
          ),
        })}
      </InputRefCtx.Provider>
    </FieldCtx.Provider>
  );
}

/* ---------------------------------------------------------------- To, Cc, Bcc */

export interface RecipientFieldsValue {
  to: string[];
  cc: string[];
  bcc: string[];
}

export interface RecipientFieldsProps extends Omit<
  PartProps<"div">,
  "children" | "onChange" | "defaultValue"
> {
  value?: RecipientFieldsValue;
  defaultValue?: RecipientFieldsValue;
  onChange?: (value: RecipientFieldsValue) => void;
  contacts?: ReadonlyArray<ConversationContact>;
  validate?: (address: string) => boolean;
  disabled?: boolean;
  /** The words for the three fields. Default To, Cc, Bcc. */
  labels?: { to?: string; cc?: string; bcc?: string };
  /** The parts (`RecipientFieldsRow`, `RecipientFieldsInput`, `RecipientFieldsToggles`). */
  children?: ReactNode;
}

const NONE: RecipientFieldsValue = { to: [], cc: [], bcc: [] };

interface FieldsContext {
  fields: RecipientFieldsValue;
  setFields: (value: RecipientFieldsValue) => void;
  showCc: boolean;
  showBcc: boolean;
  setShowCc: (show: boolean) => void;
  setShowBcc: (show: boolean) => void;
  words: { to: string; cc: string; bcc: string };
  shared: Pick<RecipientInputProps, "contacts" | "validate" | "disabled">;
}
const FieldsCtx = createContext<FieldsContext | null>(null);

function useFields(name: string): FieldsContext {
  const ctx = useContext(FieldsCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <RecipientFields>.`);
  return ctx;
}

/** A line of the fields: To and its toggles. */
export function RecipientFieldsRow(props: PartProps<"div">) {
  return part("div", "recipient-fields-row", "fg-conv-rcpts-row", props);
}

/** One of the three fields; Cc and Bcc show once revealed. Its own props go to the `RecipientInput`. */
export function RecipientFieldsInput({
  name,
  ...rest
}: { name: "to" | "cc" | "bcc" } & Partial<RecipientInputProps>) {
  const { fields, setFields, showCc, showBcc, words, shared } = useFields("RecipientFieldsInput");
  if ((name === "cc" && !showCc) || (name === "bcc" && !showBcc)) return null;
  return (
    <RecipientInput
      label={words[name]}
      value={fields[name]}
      onChange={(next) => setFields({ ...fields, [name]: next })}
      {...shared}
      {...rest}
    />
  );
}

/** The buttons that reveal Cc and Bcc; gone once both are shown. */
export function RecipientFieldsToggles({ children, ...rest }: PartProps<"span">) {
  const { showCc, showBcc, setShowCc, setShowBcc, words } = useFields("RecipientFieldsToggles");
  return part("span", "recipient-fields-toggles", "fg-conv-rcpts-toggles", {
    ...rest,
    children: children ?? (
      <>
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
      </>
    ),
  });
}

/** To, with Cc and Bcc revealed by two buttons (open from the start when they hold addresses). */
export function RecipientFields({
  value,
  defaultValue = NONE,
  onChange,
  contacts,
  validate,
  disabled,
  labels,
  children,
  className,
  asChild,
  ...rest
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
    <FieldsCtx.Provider
      value={{ fields, setFields, showCc, showBcc, setShowCc, setShowBcc, words, shared }}
    >
      {part("div", "recipient-fields", "fg-conv-rcpts", {
        className,
        asChild,
        ...rest,
        children: children ?? (
          <>
            <RecipientFieldsRow>
              <RecipientFieldsInput name="to" />
              <RecipientFieldsToggles />
            </RecipientFieldsRow>
            <RecipientFieldsInput name="cc" />
            <RecipientFieldsInput name="bcc" />
          </>
        ),
      })}
    </FieldsCtx.Provider>
  );
}
