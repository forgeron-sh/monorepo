// Point d'entrée du SDK. L'API publique est spécifiée dans docs/sdk.md.

/** Niveaux d'accès standard d'une action (docs/sdk.md, section 1). */
export const ACCESS_LEVELS = ["read", "write", "delete", "admin"] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];
