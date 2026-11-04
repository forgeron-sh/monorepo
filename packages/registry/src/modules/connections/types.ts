/** The tokens of one person's consent. Sealed in the database, never returned to a person. */
export interface ConnectionTokens {
  accessToken: string;
  refreshToken?: string;
}

/** What is known about a consent without its tokens: what the person and the admin may see. */
export interface ConnectionInfo {
  userId: string;
  connector: string;
  scopes: string[];
  /** When the access token expires, if the provider said. */
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
