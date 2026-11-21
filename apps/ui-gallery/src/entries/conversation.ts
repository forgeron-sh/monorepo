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
      "MessageListScroll",
      "MessageListOlder",
      "MessageListRows",
      "MessageListDay",
      "MessageListUnread",
      "MessageListSystem",
      "MessageListJump",
      "MessageListStatus",
      "MessageItemSide",
      "MessageItemMain",
      "MessageItemHeader",
      "MessageItemQuote",
      "MessageItemBody",
      "MessageItemState",
      "MessageItemAttachments",
      "MessageItemReactions",
      "MessageItemReplies",
      "MessageItemActions",
      "useMessageItem",
    ],
    props: [
      {
        name: "Parts",
        type: "MessageListScroll, MessageListOlder, MessageListRows, MessageListDay, MessageListUnread, MessageListSystem, MessageListJump, MessageListStatus, MessageItemSide, MessageItemMain, MessageItemHeader, MessageItemQuote, MessageItemBody, MessageItemState, MessageItemAttachments, MessageItemReactions, MessageItemReplies, MessageItemActions, useMessageItem",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props. MessageItem takes ...rest (the list puts the collection's item props on it: a roving focus).",
      },
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
    slug: "reaction-bar",
    name: "Reaction bar",
    summary:
      "Emoji with their count, yours pressed, who reacted in a tooltip, and a button to add one.",
    imports: [
      "ReactionBar",
      "toggleConversationReaction",
      "conversationReactionLabel",
      "ReactionBarChips",
      "ReactionBarChip",
      "ReactionBarAdd",
    ],
    props: [
      {
        name: "Parts",
        type: "ReactionBarChips, ReactionBarChip, ReactionBarAdd",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props.",
      },
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
    imports: [
      "ThreadPanel",
      "ThreadPanelHeader",
      "ThreadPanelTitle",
      "ThreadPanelCount",
      "ThreadPanelClose",
      "ThreadPanelMessage",
      "ThreadPanelReplies",
      "ThreadPanelTyping",
      "ThreadPanelComposer",
    ],
    props: [
      {
        name: "Parts",
        type: "ThreadPanelHeader, ThreadPanelTitle, ThreadPanelCount, ThreadPanelClose, ThreadPanelMessage, ThreadPanelReplies, ThreadPanelTyping, ThreadPanelComposer",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props.",
      },
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
    imports: [
      "ConversationList",
      "groupConversationItems",
      "conversationListTime",
      "ConversationListGroups",
      "ConversationListSection",
      "ConversationListRow",
      "ConversationListWho",
      "ConversationListTitle",
      "ConversationListTime",
      "ConversationListPreview",
      "ConversationListCount",
    ],
    props: [
      {
        name: "Parts",
        type: "ConversationListGroups, ConversationListSection, ConversationListRow, ConversationListWho, ConversationListTitle, ConversationListTime, ConversationListPreview, ConversationListCount",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props.",
      },
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
      "RecipientInputLabel",
      "RecipientInputField",
      "RecipientInputBox",
      "RecipientInputSuggestions",
      "RecipientInputStatus",
      "RecipientFieldsRow",
      "RecipientFieldsInput",
      "RecipientFieldsToggles",
    ],
    props: [
      {
        name: "Parts",
        type: "RecipientInputLabel, RecipientInputField, RecipientInputBox, RecipientInputSuggestions, RecipientInputStatus, RecipientFieldsRow, RecipientFieldsInput, RecipientFieldsToggles",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props.",
      },
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
    imports: [
      "TypingIndicator",
      "PresenceDot",
      "conversationTypingLabel",
      "PresenceDotMark",
      "PresenceDotLabel",
      "TypingIndicatorDots",
      "TypingIndicatorText",
    ],
    props: [
      {
        name: "Parts",
        type: "PresenceDotMark, PresenceDotLabel, TypingIndicatorDots, TypingIndicatorText",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props.",
      },
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
    imports: [
      "AttachmentList",
      "AttachmentListItem",
      "AttachmentListThumb",
      "AttachmentListBody",
      "AttachmentListName",
      "AttachmentListMeta",
      "AttachmentListProgress",
      "AttachmentListActions",
      "AttachmentListDownload",
      "AttachmentListRetry",
      "AttachmentListRemove",
    ],
    props: [
      {
        name: "Parts",
        type: "AttachmentListItem, AttachmentListThumb, AttachmentListBody, AttachmentListName, AttachmentListMeta, AttachmentListProgress, AttachmentListActions, AttachmentListDownload, AttachmentListRetry, AttachmentListRemove",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props.",
      },
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
  {
    slug: "inline-comments",
    name: "Inline comments",
    summary: "Threads in the margin, each beside the block or text range it is about.",
    imports: [
      "InlineComments",
      "inlineCommentAnchorTop",
      "structureRebaseAnchor",
      "structureLayoutThreads",
      "InlineCommentsBar",
      "InlineCommentsLane",
      "InlineCommentsThreads",
      "InlineCommentsThread",
      "InlineCommentsQuote",
      "InlineCommentsEntries",
      "InlineCommentsComposer",
      "InlineCommentsActions",
      "InlineCommentsDraft",
      "InlineCommentsEmpty",
    ],
    props: [
      {
        name: "Parts",
        type: "InlineCommentsBar, InlineCommentsLane, InlineCommentsThreads, InlineCommentsThread, InlineCommentsQuote, InlineCommentsEntries, InlineCommentsComposer, InlineCommentsActions, InlineCommentsDraft, InlineCommentsEmpty",
        description:
          "With children, the block is a frame and these parts compose it; each takes className, ...rest, a data-slot and, on one element, asChild. Without children it builds them from its props.",
      },
      {
        name: "threads",
        type: "InlineThread[]",
        description:
          "{ id, anchor, status: 'open' | 'resolved', comments: { id, author, avatar?, at, body }[] }. anchor: { kind: 'block', blockId } or { kind: 'range', blockId, start, end, quote? }.",
      },
      {
        name: "anchorsIn",
        type: "string | RefObject | HTMLElement",
        description:
          "The element of the document whose [data-block-id] children are the blocks. The cards sit beside their anchors, and move when the document changes.",
      },
      {
        name: "measure",
        type: "(anchor) => number | null",
        description: "Where an anchor is (px from the top of the margin), instead of anchorsIn.",
      },
      {
        name: "layout",
        type: `"margin" | "stack"`,
        default: `"margin"`,
        description: "Beside the anchors, or one under the other.",
      },
      {
        name: "filter / defaultFilter / onFilterChange",
        type: `"open" | "resolved" | "all"`,
        default: `"open"`,
        description: "Which threads.",
      },
      {
        name: "active / defaultActive / onActiveChange",
        type: "string | null",
        description: "The thread in front: it stays on its anchor and the others make room.",
      },
      {
        name: "onReply",
        type: "(threadId, text, mentions) => void",
        description: "From the box under a thread.",
      },
      {
        name: "onResolve / onReopen",
        type: "(threadId) => void",
        description: "The thread's buttons.",
      },
      {
        name: "draft / onCreate / onCancelDraft",
        type: "StructureAnchor | null; (anchor, text, mentions) => void",
        description: "A selection to comment on: a card with a box at that place.",
      },
      {
        name: "mentions",
        type: "MentionOption[]",
        description: "The people @ offers in the boxes (RichComposer).",
      },
      { name: "gap", type: "number", default: "8", description: "Space between two cards." },
      className,
    ],
  },
];
