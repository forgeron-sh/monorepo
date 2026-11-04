import type { RegisteredEnvironment } from "../../kernel/errors";

export type SecretState = "set" | "missing";

/** One secret the tool declares, and whether each environment has it. Never a value. */
export interface SecretStatus {
  name: string;
  environments: Record<RegisteredEnvironment, SecretState>;
}
