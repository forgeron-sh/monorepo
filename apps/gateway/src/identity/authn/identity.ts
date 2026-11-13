// Who a sign-in proved the person to be, whatever the protocol (OIDC, SAML, email).
export interface Identity {
  /** The provider's stable id for the person. */
  subject: string;
  email: string;
  name: string;
  /** The address of the person's picture at the provider, when it states one (D-133). */
  picture?: string;
  /** The groups the provider states, if a groups claim is configured. */
  groups: string[];
}
