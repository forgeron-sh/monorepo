// Blocks of the "record" group, after the Tasks prototype. Each block lives in its own file next to
// this one; this barrel re-exports them.

export { Activity, CommentComposer } from "./record-activity";
export type {
  ActivityComment,
  ActivityEvent,
  ActivityItem,
  ActivityProps,
  CommentComposerProps,
} from "./record-activity";
export { CreateDialog, Modal } from "./record-create";
export type { CreateDialogProps, CreateDraft, ModalProps } from "./record-create";
export { PropertyChips, PropertyPanel, PropertyText } from "./record-properties";
export type {
  PropertyChipsProps,
  PropertyHeading,
  PropertyPanelProps,
  PropertyRow,
  PropertyTextProps,
} from "./record-properties";
