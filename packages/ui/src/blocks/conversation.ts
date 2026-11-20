// Blocks of the "conversation" group: chat, mail, helpdesk, comments and portals, for any app that
// lets people write to each other. Each block lives in its own file next to this one; this barrel
// re-exports them.

export {
  addRecipients,
  applyConversationFormat,
  buildConversationRows,
  conversationContactEmails,
  conversationDayKey,
  conversationDayLabel,
  conversationFirstUnread,
  conversationListTime,
  conversationMentionToken,
  conversationMentionsToMarkdown,
  conversationPlainText,
  conversationReactionLabel,
  conversationTime,
  conversationTypingLabel,
  conversationUnreadCount,
  conversationUnreadLabel,
  filterMentionOptions,
  findMentionTrigger,
  groupConversationItems,
  insertMention,
  isEmailAddress,
  parseConversationInline,
  parseMentions,
  parseRecipientText,
  toggleConversationReaction,
} from "./conversation-model";
export type {
  ActiveTrigger,
  ConversationAttachment,
  ConversationAuthor,
  ConversationContact,
  ConversationFormat,
  ConversationGrouping,
  ConversationInline,
  ConversationMessage,
  ConversationMessageStatus,
  ConversationQuote,
  ConversationReaction,
  ConversationRow,
  ConversationSection,
  ConversationUser,
  MentionOption,
  MentionTrigger,
  ParsedMention,
  ParsedRecipient,
  TextEdit,
} from "./conversation-model";
export { PresenceDot, TypingIndicator } from "./conversation-presence";
export type {
  PresenceDotProps,
  PresenceStatus,
  TypingIndicatorProps,
} from "./conversation-presence";
export { AttachmentList } from "./conversation-attachments";
export type { AttachmentListProps } from "./conversation-attachments";
export { ReactionBar } from "./conversation-emoji";
export type { ReactionBarProps } from "./conversation-emoji";
export { ConversationText, MessageItem } from "./conversation-message";
export type { MessageHandlers, MessageItemProps } from "./conversation-message";
export { MessageList } from "./conversation-message-list";
export type { MessageListProps } from "./conversation-message-list";
export { ThreadPanel } from "./conversation-thread-panel";
export type { ThreadPanelProps } from "./conversation-thread-panel";
export { ConversationList } from "./conversation-list";
export type { ConversationListItem, ConversationListProps } from "./conversation-list";
export { RecipientFields, RecipientInput } from "./conversation-recipients";
export type {
  RecipientFieldsProps,
  RecipientFieldsValue,
  RecipientInputProps,
} from "./conversation-recipients";
export { InlineComments, inlineCommentAnchorTop } from "./conversation-comments";
export type {
  InlineComment,
  InlineCommentsProps,
  InlineThread,
  InlineThreadFilter,
} from "./conversation-comments";
