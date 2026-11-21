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
export {
  PresenceDot,
  PresenceDotLabel,
  PresenceDotMark,
  TypingIndicator,
  TypingIndicatorDots,
  TypingIndicatorText,
} from "./conversation-presence";
export type {
  PresenceDotProps,
  PresenceStatus,
  TypingIndicatorProps,
} from "./conversation-presence";
export {
  AttachmentList,
  AttachmentListActions,
  AttachmentListBody,
  AttachmentListDownload,
  AttachmentListItem,
  AttachmentListMeta,
  AttachmentListName,
  AttachmentListProgress,
  AttachmentListRemove,
  AttachmentListRetry,
  AttachmentListThumb,
} from "./conversation-attachments";
export type { AttachmentListItemProps, AttachmentListProps } from "./conversation-attachments";
export {
  ReactionBar,
  ReactionBarAdd,
  ReactionBarChip,
  ReactionBarChips,
} from "./conversation-emoji";
export type { ReactionBarChipProps, ReactionBarProps } from "./conversation-emoji";
export {
  ConversationText,
  MessageItem,
  MessageItemActions,
  MessageItemAttachments,
  MessageItemBody,
  MessageItemHeader,
  MessageItemMain,
  MessageItemQuote,
  MessageItemReactions,
  MessageItemReplies,
  MessageItemSide,
  MessageItemState,
  useMessageItem,
} from "./conversation-message";
export type { MessageHandlers, MessageItemProps } from "./conversation-message";
export {
  MessageList,
  MessageListDay,
  MessageListJump,
  MessageListOlder,
  MessageListRows,
  MessageListScroll,
  MessageListStatus,
  MessageListSystem,
  MessageListUnread,
} from "./conversation-message-list";
export type { MessageListProps } from "./conversation-message-list";
export {
  ThreadPanel,
  ThreadPanelClose,
  ThreadPanelComposer,
  ThreadPanelCount,
  ThreadPanelHeader,
  ThreadPanelMessage,
  ThreadPanelReplies,
  ThreadPanelTitle,
  ThreadPanelTyping,
} from "./conversation-thread-panel";
export type { ThreadPanelProps } from "./conversation-thread-panel";
export {
  ConversationList,
  ConversationListCount,
  ConversationListGroups,
  ConversationListPreview,
  ConversationListRow,
  ConversationListSection,
  ConversationListTime,
  ConversationListTitle,
  ConversationListWho,
} from "./conversation-list";
export type { ConversationListItem, ConversationListProps } from "./conversation-list";
export {
  RecipientFields,
  RecipientFieldsInput,
  RecipientFieldsRow,
  RecipientFieldsToggles,
  RecipientInput,
  RecipientInputBox,
  RecipientInputField,
  RecipientInputLabel,
  RecipientInputStatus,
  RecipientInputSuggestions,
} from "./conversation-recipients";
export type {
  RecipientFieldsProps,
  RecipientFieldsValue,
  RecipientInputProps,
} from "./conversation-recipients";
export {
  InlineComments,
  InlineCommentsActions,
  InlineCommentsBar,
  InlineCommentsComposer,
  InlineCommentsDraft,
  InlineCommentsEmpty,
  InlineCommentsEntries,
  InlineCommentsLane,
  InlineCommentsQuote,
  InlineCommentsThread,
  InlineCommentsThreads,
  inlineCommentAnchorTop,
} from "./conversation-comments";
export type {
  InlineComment,
  InlineCommentsProps,
  InlineThread,
  InlineThreadFilter,
} from "./conversation-comments";
