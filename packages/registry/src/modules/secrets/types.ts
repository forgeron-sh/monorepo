import type { SecretEnvironment } from "../../kernel/errors";

export type SecretState = "set" | "missing";

/** One secret the tool declares, and whether each environment has it. Never a value. */
export interface SecretStatus {
  name: string;
  environments: Record<SecretEnvironment, SecretState>;
}

/** What a person is shown about a link before they type: where the secret goes, never a value. */
export interface SecretRequestInfo {
  toolId: string;
  tool: string;
  environment: SecretEnvironment;
  name: string;
  expiresAt: string;
}

/** Why a link cannot be used: it is unknown or another person's, it ran out, or it was spent. */
export type SecretRequestRefusal = "unknown" | "expired" | "used";
