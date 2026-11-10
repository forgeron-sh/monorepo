import { addresses } from "@forgeron/platform-contract/client";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { parseArgs } from "node:util";
import { clearCredentials, readCredentials, writeCredentials } from "../credentials";
import { UsageError, type Io } from "../io";
import { platformClient, refusal } from "../platform-client";
import { resolveEndpoint } from "../project";

const LOGIN_USAGE = "Usage: forgeron login [--workspace <name | host>] [--endpoint <url>]";

// How long the browser has to come back.
const WAIT_MS = 5 * 60_000;

const b64 = (bytes: Buffer) => bytes.toString("base64url");

/**
 * `forgeron login`: opens the browser on the workspace's sign-in (its SSO) and waits for it to come
 * back on a loopback address with a one-time code, which it trades, with a PKCE verifier, for the
 * person's token. The token goes to the keychain, or to `~/.config/forgeron/credentials` (600).
 */
export async function login(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { workspace: { type: "string" }, endpoint: { type: "string" } },
  });
  if (positionals.length > 0) throw new UsageError(LOGIN_USAGE);
  const endpoint = await resolveEndpoint(values, io.cwd);

  const state = b64(randomBytes(16));
  const verifier = b64(randomBytes(32));
  const challenge = b64(createHash("sha256").update(verifier).digest());

  // A one-shot server on the loopback interface only: nothing else on the network can reach it.
  let arrived!: (query: URLSearchParams) => void;
  const callback = new Promise<URLSearchParams>((resolve) => (arrived = resolve));
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/callback") {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("You are signed in to Forgeron. You can close this tab.");
    arrived(url.searchParams);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const redirectUri = `http://127.0.0.1:${(server.address() as AddressInfo).port}/callback`;

  try {
    const target = new URL("/auth/cli", endpoint);
    target.search = new URLSearchParams({
      redirect_uri: redirectUri,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();
    io.log("Opening your browser to sign in. If nothing opens, go to:");
    io.log(target.toString());
    await io.openUrl?.(target.toString()).catch(() => undefined);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const query = await Promise.race([
      callback,
      io.stopped.then(() => undefined),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), WAIT_MS);
      }),
    ]).finally(() => clearTimeout(timer));
    if (!query) {
      io.error("Sign-in was not completed.");
      return 1;
    }
    if (query.get("state") !== state) {
      io.error("The sign-in answer is not the one this command asked for: nothing was stored.");
      return 1;
    }
    const code = query.get("code");
    if (query.get("error") || !code) {
      io.error(
        `The workspace refused the sign-in${query.get("error") ? `: ${query.get("error")}` : ""}.`,
      );
      return 1;
    }

    const answer = await platformClient(endpoint)(addresses.cliToken, {
      json: { code, code_verifier: verifier, redirect_uri: redirectUri },
    });
    if (answer.status !== 200 || !answer.body?.token) {
      io.error(refusal(answer));
      return 1;
    }
    const where = await writeCredentials(answer.body.token, process.env, io.keychain);
    io.log(
      `Signed in to ${new URL(endpoint).host}. The token is stored in ${
        where === "keychain"
          ? "the system keychain"
          : "~/.config/forgeron/credentials (permissions 600)"
      }.`,
    );
    return 0;
  } finally {
    server.close();
    server.closeAllConnections();
  }
}

/** `forgeron logout`: forgets the stored token, wherever it is. */
export async function logout(args: string[], io: Io): Promise<number> {
  if (args.length > 0) throw new UsageError("Usage: forgeron logout");
  const was = await readCredentials(process.env, io.keychain);
  await clearCredentials(process.env, io.keychain);
  io.log(was ? "Signed out." : "You were not signed in.");
  return 0;
}

/** `forgeron whoami`: who the workspace says the stored token is. */
export async function whoami(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { workspace: { type: "string" }, endpoint: { type: "string" } },
  });
  if (positionals.length > 0)
    throw new UsageError("Usage: forgeron whoami [--workspace <name | host>]");
  const token = await readCredentials(process.env, io.keychain);
  if (!token) throw new UsageError("Not signed in: run `forgeron login` first.");
  const endpoint = await resolveEndpoint(values, io.cwd);

  const answer = await platformClient(endpoint, token)(addresses.whoami);
  if (answer.status !== 200 || !answer.body?.email) {
    io.error(
      answer.status === 401
        ? "The stored token is not valid any more: run `forgeron login` again."
        : refusal(answer),
    );
    return 1;
  }
  const body = answer.body;
  io.log(
    `${body.name ?? body.email} <${body.email}> on ${body.workspace ?? new URL(endpoint).host}`,
  );
  return 0;
}
