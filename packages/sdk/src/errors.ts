/** Shared error codes, translated for each interface (docs/sdk.md, section 6). */
export const TOOL_ERROR_CODES = [
  "INVALID",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "SECRET_REQUIRED",
  "UPSTREAM",
] as const;

export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[number];

/** What an action throws to report a failure the caller should see. */
export class ToolError extends Error {
  readonly code: ToolErrorCode;
  readonly details: unknown;

  constructor(code: ToolErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ToolError";
    this.code = code;
    this.details = details;
  }
}
