import type { EnvironmentName } from "@forgeron/hosting";

export type RegisteredEnvironment = Exclude<EnvironmentName, "local">;

/**
 * Where tool secrets and connections are kept: production's, and the others' (D-125: a temporary
 * channel and a permanent channel other than production share the `preview` ones, so that
 * production's credentials never leave production).
 */
export type SecretEnvironment = "preview" | "production";

/** The secrets and connections an environment uses. */
export const secretEnvironmentOf = (name: RegisteredEnvironment): SecretEnvironment =>
  name === "production" ? "production" : "preview";

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
  | "FORBIDDEN"
  | "PROTECTED"
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
