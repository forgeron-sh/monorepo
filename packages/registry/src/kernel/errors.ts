import type { EnvironmentName } from "@forgeron/hosting";

export type RegisteredEnvironment = Exclude<EnvironmentName, "local">;

export type RegistryErrorCode =
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "ALREADY_DECIDED"
  | "BRANCH_REQUIRED"
  | "WRONG_TOOL"
  | "NO_ARTIFACT"
  | "NO_PREVIOUS"
  | "NO_SECRET_KEY"
  | "PENDING_APPROVAL"
  | "NO_MANIFEST"
  | "LAST_ADMIN"
  | "INVALID"
  | "INVALID_DOCS";

export class RegistryError extends Error {
  override name = "RegistryError";
  readonly code: RegistryErrorCode;
  constructor(code: RegistryErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
