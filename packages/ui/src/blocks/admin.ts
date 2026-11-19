// Blocks of the "administration" group: permissions, notifications, invitations, tokens, secrets,
// webhooks, export and the trash, for any app with settings (a console, a directory, your own).
// Each block lives in its own file next to this one; this barrel re-exports them.

export {
  adminDay,
  adminDaysBetween,
  adminPlural,
  bulkTarget,
  canRedeliver,
  channelCoverage,
  classifyInvites,
  columnCells,
  DEFAULT_EXPORT_FORMATS,
  DEFAULT_QUIET_HOURS,
  DELIVERY_STATUS_NAMES,
  DELIVERY_TONES,
  deliveryCodeText,
  deliveryCounts,
  DIGEST_FREQUENCIES,
  DIGEST_NAMES,
  EMPTY_NOTIFICATION_PREFS,
  ENDPOINT_STATUS_NAMES,
  EXPIRY_CHOICES,
  expiryDay,
  exportFilename,
  exportPercent,
  exportPreview,
  exportProblem,
  filterDeliveries,
  formatAdminDate,
  formatDeliveryDuration,
  gridMove,
  groupEvents,
  groupScopes,
  inQuietHours,
  inviteCounts,
  inviteSummary,
  isChannelOn,
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
  quietHoursText,
  relativeDay,
  retentionDaysLeft,
  retentionText,
  retentionUrgent,
  rowCells,
  samePrefs,
  SECRET_MASK,
  SECRET_REVEAL_MS,
  secondsLeft,
  secretProblem,
  setChannel,
  setChannelForEvents,
  setPermission,
  setPermissions,
  sharedState,
  sortByRetention,
  toggleIn,
  tokenExpiry,
  tokenExpiryText,
  tokenProblems,
  visibleEvents,
  visibleScopes,
} from "./admin-model";
export type {
  ApiToken,
  DeliveryFilter,
  DeliveryStatus,
  DigestFrequency,
  EndpointStatus,
  ExpiryChoice,
  ExportColumn,
  ExportFormat,
  ExportRange,
  ExportRequest,
  ExportState,
  InviteOutcome,
  InviteResult,
  NewTokenInput,
  NotificationChannel,
  NotificationEvent,
  NotificationPrefs,
  PermissionChange,
  PermissionColumn,
  PermissionState,
  PermissionSubject,
  PermissionValue,
  QuietHours,
  TokenExpiry,
  TokenScope,
  TrashEntry,
  WebhookDelivery,
  WebhookEndpoint,
} from "./admin-model";
export { PermissionMatrix } from "./admin-permission-matrix";
export type { PermissionMatrixProps } from "./admin-permission-matrix";
export { NotificationPreferences } from "./admin-notification-preferences";
export type { NotificationPreferencesProps } from "./admin-notification-preferences";
export { InviteDialog } from "./admin-invite-dialog";
export type { InviteDialogProps, InviteDraft, InviteRequest } from "./admin-invite-dialog";
export { TokenManager } from "./admin-token-manager";
export type { CreatedToken, TokenManagerProps } from "./admin-token-manager";
export { SecretField } from "./admin-secret-field";
export type { SecretFieldProps } from "./admin-secret-field";
export { EndpointList } from "./admin-endpoints";
export type { EndpointListProps, EndpointTestResult } from "./admin-endpoints";
export { DeliveryLog } from "./admin-delivery-log";
export type { DeliveryLogProps } from "./admin-delivery-log";
export { ExportDialog } from "./admin-export-dialog";
export type { ExportDialogProps } from "./admin-export-dialog";
export { TrashList } from "./admin-trash-list";
export type { TrashListProps } from "./admin-trash-list";
