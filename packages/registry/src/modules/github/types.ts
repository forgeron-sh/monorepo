import type { Row } from "../../kernel/rows";

/** The GitHub App of a workspace (D-123), as anyone may read it: never its keys. */
export interface GithubApp {
  workspace: string;
  /** GitHub's number for the app: the `iss` of its JWT. */
  appId: number;
  /** Its name in addresses: `https://github.com/apps/<slug>`. */
  slug: string;
  clientId: string;
  /** The organisation or account that owns the app. */
  owner: string;
  /** The app's page on GitHub. */
  htmlUrl: string;
  createdBy: string;
  createdAt: string;
}

/** What GitHub gave once, at the app's creation, sealed under `github-app/<workspace>`. */
export interface GithubAppKeys {
  /** The app's private key, PEM (PKCS#1, as GitHub gives it). */
  privateKey: string;
  /** What GitHub signs each webhook delivery with. */
  webhookSecret: string;
  clientSecret: string;
}

/** An installation of the app: on an organisation or an account, for some or all of its repositories. */
export interface GithubInstallation {
  workspace: string;
  installationId: number;
  /** The organisation or account it is installed on. */
  account: string;
  accountType: "Organization" | "User";
  createdAt: string;
}

export const toGithubApp = (r: Row): GithubApp => ({
  workspace: String(r.workspace),
  appId: Number(r.app_id),
  slug: String(r.slug),
  clientId: String(r.client_id),
  owner: String(r.owner),
  htmlUrl: String(r.html_url),
  createdBy: String(r.created_by),
  createdAt: String(r.created_at),
});

export const toGithubInstallation = (r: Row): GithubInstallation => ({
  workspace: String(r.workspace),
  installationId: Number(r.installation_id),
  account: String(r.account),
  accountType: r.account_type === "User" ? "User" : "Organization",
  createdAt: String(r.created_at),
});
