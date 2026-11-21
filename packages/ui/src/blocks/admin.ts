// Blocks of the "administration" group: permissions, invitations, export, the trash and
// the audit log, for any app with settings (a console, a directory, your own).
// Each block lives in its own file next to this one; this barrel re-exports them.

export {
  adminDay,
  adminDaysBetween,
  adminPlural,
  bulkTarget,
  classifyInvites,
  columnCells,
  DEFAULT_EXPORT_FORMATS,
  exportFilename,
  exportPercent,
  exportPreview,
  exportProblem,
  formatAdminDate,
  gridMove,
  inviteCounts,
  inviteSummary,
  isInviteEmail,
  nextPermissionState,
  normalizeEmail,
  orderedColumns,
  parseEmails,
  PERMISSION_NAMES,
  PERMISSION_STATES,
  permissionAt,
  permissionDiff,
  permissionKey,
  permissionSummary,
  relativeDay,
  retentionDaysLeft,
  retentionText,
  retentionUrgent,
  rowCells,
  setPermission,
  setPermissions,
  sharedState,
  sortByRetention,
  toggleIn,
} from "./admin-model";
export type {
  ExportColumn,
  ExportFormat,
  ExportRange,
  ExportRequest,
  ExportState,
  InviteOutcome,
  InviteResult,
  PermissionChange,
  PermissionColumn,
  PermissionState,
  PermissionSubject,
  PermissionValue,
  TrashEntry,
} from "./admin-model";
export {
  PermissionMatrix,
  PermissionMatrixBar,
  PermissionMatrixChanges,
  PermissionMatrixGrid,
  PermissionMatrixKeys,
  PermissionMatrixLegend,
  PermissionMatrixStatus,
  PermissionMatrixSummary,
  usePermissionMatrix,
} from "./admin-permission-matrix";
export type { PermissionMatrixProps } from "./admin-permission-matrix";
export {
  InviteDialog,
  InviteDialogActions,
  InviteDialogBody,
  InviteDialogEmails,
  InviteDialogFooter,
  InviteDialogHeader,
  InviteDialogMessage,
  InviteDialogResults,
  InviteDialogTeams,
  useInviteDialog,
} from "./admin-invite-dialog";
export type { InviteDialogProps, InviteDraft, InviteRequest } from "./admin-invite-dialog";
export {
  ExportDialog,
  ExportDialogActions,
  ExportDialogColumns,
  ExportDialogDone,
  ExportDialogError,
  ExportDialogFooter,
  ExportDialogFormats,
  ExportDialogHeader,
  ExportDialogOptions,
  ExportDialogPreview,
  ExportDialogProgress,
  ExportDialogRanges,
  useExportDialog,
} from "./admin-export-dialog";
export type { ExportDialogProps } from "./admin-export-dialog";
export {
  TrashList,
  TrashListBar,
  TrashListEmpty,
  TrashListNotice,
  TrashListRow,
  TrashListRows,
  useTrashList,
} from "./admin-trash-list";
export type { TrashListProps } from "./admin-trash-list";
export {
  AuditLog,
  AuditLogDay,
  AuditLogEmpty,
  AuditLogEvent,
  useAuditLog,
} from "./admin-audit-log";
export type { AuditEvent, AuditLogProps } from "./admin-audit-log";
