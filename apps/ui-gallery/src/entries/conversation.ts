/* Blocks of the "conversation" group: chat, mail, helpdesk, comments and portals, for any app that lets people write to each other. */
import type { Atom, PropRow } from "../types";

const className: PropRow = { name: "className", type: "string", description: "Extra classes." };
const handlers: ReadonlyArray<PropRow> = [
  {
    name: "currentUserId",
    type: "string",
    description: "Whose messages are yours: edit and delete are offered on them, they are marked.",
  },
  {
    name: "onReact",
    type: "(messageId, emoji) => void",
    description:
      "An emoji pressed or chosen on a message. The caller adds or removes it (toggleConversationReaction).",
  },
  {
    name: "onReply / onOpenThread",
    type: "(message) => void",
    description: "Reply (the caller fills the composer's reply bar); open the thread of a message.",
  },
  {
    name: "onEdit / onDelete / onCopy",
    type: "(message) => void",
    description:
      "Edit and delete are offered on your own messages; copy uses the clipboard by default.",
  },
  {
    name: "onRetry / onDiscard",
    type: "(message) => void",
    description: "On a message whose status is failed.",
  },
  {
    name: "actions / onAction",
    type: "(message) => ActionMenuEntry[]; (id, message) => void",
    description:
      "More rows in each message's menu. onAction also hears the usual ids (reply, thread, copy, edit, delete).",
  },
  {
    name: "onMentionClick",
    type: "({ char, id, label }) => void",
    description: "Mentions become buttons.",
  },
  {
    name: "timeZone",
    type: "string",
    description: "IANA zone for days and times; the device's by default.",
  },
];

/** Gallery pages of the "conversation" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "message-list",
    name: "Message list",
    summary:
      "A log of messages: runs by author and day, a new-messages divider, reactions, threads, states, anchored at the bottom.",
    imports: [
      "MessageList",
      "MessageItem",
      "buildConversationRows",
      "conversationFirstUnread",
      "toggleConversationReaction",
    ],
    props: [
      {
        name: "messages",
        type: "ConversationMessage[]",
        description:
          "Oldest first: { id, at, author, body, kind?, edited?, deleted?, status?, replyTo?, reactions?, attachments?, replyCount?, lastReplyAt? }. A string body reads **bold**, *italic*, `code`, links and @[Name](id) mentions; no HTML.",
      },
      ...handlers,
      {
        name: "unreadFromId",
        type: "string | null",
        description: "The divider goes before this message. conversationFirstUnread finds it.",
      },
      {
        name: "onMarkRead",
        type: "() => void",
        description: "Once, when the person reaches the bottom while the divider is shown.",
      },
      {
        name: "stickToBottom",
        type: "boolean",
        default: "true",
        description:
          "Follow new messages while at the bottom. Scrolled up, a Jump to latest button counts what came; older messages added on top keep your place.",
      },
      {
        name: "onReachTop / loadingOlder",
        type: "() => void; boolean",
        description: "Load older messages when the top is reached.",
      },
      {
        name: "gapMinutes / now / label / newMessagesLabel / empty",
        type: "number; string; string; string; string",
        description: "Silence that starts a new run (5), the clock for Today, and the words.",
      },
      className,
    ],
  },
  {
    slug: "rich-composer",
    name: "Rich composer",
    summary:
      "A box to write: @ and # pickers, a slash hook, markdown keys, files, preview, a reply bar, your send key.",
    imports: [
      "RichComposer",
      "applyConversationFormat",
      "findMentionTrigger",
      "insertMention",
      "parseMentions",
    ],
    props: [
      {
        name: "value / defaultValue / onChange",
        type: "string",
        description: "The draft. Uncontrolled, it empties once sent.",
      },
      {
        name: "onSend",
        type: "({ text, attachments, mentions, replyToId }) => void",
        description: "On the button and the send key. Mentions are written @[Label](id) in text.",
      },
      {
        name: "sendOn",
        type: '"mod-enter" | "enter"',
        default: '"mod-enter"',
        description: "⌘↵ sends and Enter is a line; or Enter sends and ⇧↵ is a line.",
      },
      {
        name: "triggers",
        type: "{ char, label, options, atLineStart?, filter?, loading?, limit?, empty? }[]",
        description:
          "The pickers: @ for people, # for records, / (atLineStart) for commands. An option is { id, label, hint?, avatar?, insert? }; insert replaces the token (a command's text).",
      },
      {
        name: "onTrigger",
        type: "({ char, query } | null) => void",
        description:
          "The slash hook, and the way to load options from a server (set filter: false, loading, and pass the answer as options).",
      },
      {
        name: "replyTo / onCancelReply",
        type: "{ id, author, text } | null; () => void",
        description: "A bar above the box; Escape cancels it.",
      },
      {
        name: "attachments / onAttachmentsChange / attachmentOptions",
        type: "File[]; (files) => void; false | { accept, maxSize, maxFiles, onReject }",
        description: "Files go through FileInput behind the paperclip.",
      },
      {
        name: "toolbar / maxRows / label / placeholder / sendLabel / onTyping",
        type: "boolean; number; string; string; string; () => void",
        description: "Bold (⌘B), italic (⌘I), code (⌘E), list (⌘⇧L), preview; grows to maxRows.",
      },
      {
        name: "disabled / readOnly / readOnlyText",
        type: "boolean; boolean; ReactNode",
        description: "Locked states.",
      },
      className,
    ],
  },
  {
    slug: "mention-picker",
    name: "Mention picker",
    summary: "The list that opens under a trigger typed in a box: the focus stays in the box.",
    imports: [
      "MentionPicker",
      "mentionOptionId",
      "conversationCaretPosition",
      "filterMentionOptions",
    ],
    props: [
      {
        name: "options",
        type: "MentionOption[]",
        description: "{ id, label, hint?, avatar?, insert?, keywords? }.",
      },
      {
        name: "activeIndex / onActiveIndexChange",
        type: "number; (i) => void",
        description: "The highlighted row; the caller moves it with the arrows.",
      },
      { name: "onSelect", type: "(option) => void", description: "Enter, Tab or a click." },
      {
        name: "id",
        type: "string",
        description:
          "Put aria-controls={id} and aria-activedescendant={mentionOptionId(id, i)} on the box.",
      },
      {
        name: "label / empty / loading / mark",
        type: "string; string; boolean; string",
        description: "Names the list, and its words.",
      },
      {
        name: "position / placement",
        type: "{ top, left }; above | below",
        description:
          "px in a positioned parent; conversationCaretPosition(textarea, index) measures the caret.",
      },
      className,
    ],
  },
  {
    slug: "emoji-picker",
    name: "Emoji picker",
    summary:
      "Search, categories, recents and a grid moved with the arrows. Emoji are user content.",
    imports: ["EmojiPicker", "CONVERSATION_EMOJI", "searchConversationEmoji", "pushRecentEmoji"],
    props: [
      { name: "onSelect", type: "(emoji: string) => void", description: "The character chosen." },
      {
        name: "categories",
        type: "{ id, label, mark, emoji: { char, name, keywords? }[] }[]",
        description: "Your own set. The built-in one is small on purpose.",
      },
      {
        name: "recents / defaultRecents / onRecentsChange",
        type: "string[]",
        description: "Newest first; kept by the picker unless you keep them (to store them).",
      },
      {
        name: "columns / maxRecents / autoFocus / label",
        type: "number; number; boolean; string",
        description: "Layout and words.",
      },
      className,
    ],
  },
  {
    slug: "reaction-bar",
    name: "Reaction bar",
    summary:
      "Emoji with their count, yours pressed, who reacted in a tooltip, and a button to add one.",
    imports: ["ReactionBar", "toggleConversationReaction", "conversationReactionLabel"],
    props: [
      {
        name: "reactions",
        type: "{ emoji, users: { id, name }[] }[]",
        description: "In order of first use.",
      },
      { name: "currentUserId", type: "string", description: "Whose reaction is pressed." },
      {
        name: "onToggle",
        type: "(emoji) => void",
        description: "A chip pressed or an emoji chosen in the picker.",
      },
      {
        name: "canAdd / readOnly / categories",
        type: "boolean; boolean; EmojiCategory[]",
        description: "The add button, and your own set.",
      },
      className,
    ],
  },
  {
    slug: "thread-panel",
    name: "Thread panel",
    summary: "A side panel: the root message, its replies, a composer, close.",
    imports: ["ThreadPanel"],
    props: [
      {
        name: "root / replies",
        type: "ConversationMessage; ConversationMessage[]",
        description: "The message and its answers, oldest first.",
      },
      { name: "onSend", type: "(message) => void", description: "A reply sent from the composer." },
      { name: "onClose", type: "() => void", description: "The button and Escape." },
      {
        name: "composer / list",
        type: "Partial<RichComposerProps>; Partial<MessageListProps>",
        description: "Passed to the composer and the list.",
      },
      {
        name: "typing / title",
        type: "string[]; string",
        description: "Who is writing in the thread; the heading.",
      },
      ...handlers,
      className,
    ],
  },
  {
    slug: "conversation-list",
    name: "Conversation list",
    summary:
      "Rows with avatars, presence, preview, time, unread, pinned and muted, under sections.",
    imports: ["ConversationList", "groupConversationItems", "conversationListTime"],
    props: [
      {
        name: "items",
        type: "ConversationListItem[]",
        description:
          "{ id, title, people?, avatar?, presence?, preview?, previewAuthor?, at? | time?, unread?, mention?, pinned?, muted?, typing?, section? }.",
      },
      {
        name: "selectedId / onSelect",
        type: "string | null; (id) => void",
        description: "The one open; click, Enter and Space choose.",
      },
      {
        name: "sections",
        type: "{ id, label }[]",
        description: "Headings, in order; an item picks one with section.",
      },
      {
        name: "pinnedLabel",
        type: "string | false",
        default: '"Pinned"',
        description: "Pinned items sit in a section above the rest.",
      },
      {
        name: "restLabel",
        type: "string",
        default: '"All"',
        description: "The heading of the rest under the pinned ones, when there are no sections.",
      },
      {
        name: "now / timeZone / label / empty",
        type: "string; string; string; ReactNode",
        description: "Times are written as 09:41, Yesterday, Mon, 16 Nov.",
      },
      className,
    ],
  },
  {
    slug: "recipient-input",
    name: "Recipient input",
    summary:
      "To, Cc and Bcc: address tags with suggestions, groups that expand, validity, pasted lists.",
    imports: [
      "RecipientInput",
      "RecipientFields",
      "parseRecipientText",
      "isEmailAddress",
      "addRecipients",
    ],
    props: [
      { name: "label", type: "string", description: "To, Cc, Bcc." },
      { name: "value / defaultValue / onChange", type: "string[]", description: "The addresses." },
      {
        name: "contacts",
        type: "{ id, name, email?, members?, avatar? }[]",
        description:
          "Suggestions. A contact with members is a group: choosing it adds each address.",
      },
      {
        name: "validate",
        type: "(address) => boolean",
        default: "isEmailAddress",
        description: "A tag that fails is marked and said.",
      },
      {
        name: "max / disabled / onAdd / placeholder",
        type: "number; boolean; (added) => void; string",
        description: "Limits and hooks.",
      },
      {
        name: "RecipientFields",
        type: "{ to, cc, bcc }",
        description: "The three fields as one value; Cc and Bcc open from buttons.",
      },
      className,
    ],
  },
  {
    slug: "typing-indicator",
    name: "Typing indicator and presence",
    summary: "Who is writing, in a polite live region, and whether someone is there.",
    imports: ["TypingIndicator", "PresenceDot", "conversationTypingLabel"],
    props: [
      {
        name: "names",
        type: "string[]",
        description: "TypingIndicator: who is writing; empty keeps the line, silent.",
      },
      {
        name: "shown / reserve",
        type: "number; boolean",
        description: "Names written before “and n others” (2); keep the line height (true).",
      },
      {
        name: "status",
        type: '"online" | "away" | "busy" | "offline"',
        description: "PresenceDot: a square, never a circle, and a word.",
      },
      {
        name: "label / showLabel",
        type: "string; boolean",
        description: "PresenceDot: another word; write it next to the square.",
      },
      className,
    ],
  },
  {
    slug: "attachment-list",
    name: "Attachment list",
    summary: "Files with a thumbnail or mark, size, upload progress, retry, remove and download.",
    imports: ["AttachmentList"],
    props: [
      {
        name: "items",
        type: "{ id, name, size?, type?, url?, thumbnail?, progress?, error? }[]",
        description: "progress 0 to 1 while uploading; error marks it failed.",
      },
      { name: "onRemove / onRetry", type: "(item) => void", description: "Show the buttons." },
      {
        name: "layout / label",
        type: '"list" | "grid"; string',
        description: "Rows, or tiles for pictures.",
      },
      className,
    ],
  },
];
