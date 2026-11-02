// SDK entry point. The public API is specified in docs/sdk.md.

/** Standard access levels of an action (docs/sdk.md, section 1). */
export const ACCESS_LEVELS = ["read", "write", "delete", "admin"] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];
