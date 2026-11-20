// Blocks of the "approval" group: approval and signature, for any app that asks people to approve,
// sign or validate something. Each block lives in its own file next to this one; this barrel
// re-exports them.

export {
  addParticipant,
  APPROVAL_STATUS_MARKS,
  APPROVAL_STATUS_NAMES,
  APPROVAL_STATUSES,
  boxAt,
  chainProgress,
  chainStatus,
  clampPlacedBox,
  currentParticipants,
  FIELD_KINDS,
  PLACED_FIELD_TYPES,
  fieldsOfPage,
  formatStamp,
  hashPrefix,
  isFinalStatus,
  isOverdue,
  MIN_FIELD,
  moveById,
  moveItem,
  nextId,
  nudgeField,
  participantsWithoutField,
  participantTone,
  PARTICIPANT_TONES,
  removeParticipant,
  resizeField,
  resolveChain,
  setParticipants,
  setStepMode,
  stepStatus,
} from "./approval-model";
export type {
  ApprovalComment,
  ApprovalEvent,
  ApprovalParticipant,
  ApprovalStatus,
  ApprovalStep,
  FieldKind,
  PlacedFieldType,
  PlacedField,
  StepMode,
} from "./approval-model";
export { ApprovalAudit, ApprovalChain } from "./approval-chain";
export type { ApprovalAuditProps, ApprovalChainProps, ApprovalPerson } from "./approval-chain";
export { ParticipantList } from "./approval-participant-list";
export type { ParticipantListProps } from "./approval-participant-list";
export {
  clampPage,
  clampZoom,
  DocumentViewer,
  fitScale,
  stepZoom,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEPS,
} from "./approval-document-viewer";
export type {
  DocumentPage,
  DocumentViewerProps,
  PageInfo,
  SearchHit,
  ZoomValue,
} from "./approval-document-viewer";
export { FieldPlacer } from "./approval-field-placer";
export type { FieldPlacerProps } from "./approval-field-placer";
export { SealBadge } from "./approval-seal-badge";
export type { SealBadgeProps } from "./approval-seal-badge";
