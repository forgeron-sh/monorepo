// Blocks of the "record" group, after the Tasks prototype. Each block lives in its own file next to
// this one; this barrel re-exports them.

export {
  Activity,
  ActivityCommentBody,
  ActivityCommentHeader,
  ActivityCommentItem,
  ActivityCommentQuote,
  ActivityEventItem,
  ActivityHeader,
  ActivityList,
  ActivityTitle,
  CommentComposer,
  CommentComposerFooter,
  CommentComposerInput,
  CommentComposerSubmit,
  useCommentComposer,
} from "./record-activity";
export type {
  ActivityComment,
  ActivityCommentItemProps,
  ActivityEvent,
  ActivityEventItemProps,
  ActivityItem,
  ActivityProps,
  ActivityRootProps,
  CommentComposerProps,
} from "./record-activity";
export {
  CreateDialog,
  CreateDialogClose,
  CreateDialogContent,
  CreateDialogContext,
  CreateDialogDescription,
  CreateDialogFooter,
  CreateDialogForm,
  CreateDialogHeader,
  CreateDialogHeading,
  CreateDialogMore,
  CreateDialogProperties,
  CreateDialogSubmit,
  CreateDialogTitle,
  CreateDialogTrigger,
  useCreateDialogForm,
} from "./record-create";
export type { CreateDialogProps, CreateDraft } from "./record-create";
export {
  PropertyChips,
  PropertyPanel,
  PropertyPanelGroup,
  PropertyPanelHeading,
  PropertyPanelLabel,
  PropertyPanelList,
  PropertyPanelRow,
  PropertyPanelValue,
  PropertyText,
} from "./record-properties";
export type {
  PropertyChipsProps,
  PropertyHeading,
  PropertyPanelProps,
  PropertyPanelRootProps,
  PropertyRow,
  PropertyTextProps,
} from "./record-properties";
