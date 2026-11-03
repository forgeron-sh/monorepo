import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import { readCredentials, writeCredentials, type Keychain } from "./credentials";
import type { Io } from "./io";

// The workspace's side of `forgeron login`, simulated: `/auth/cli` is the page the browser opens (it
// signs the person in and sends them back to the loopback address), `/auth/cli/token` trades the code.
let server: Server;
let endpoint: string;
const codes = new Map<string, { challenge: string; redirectUri: string }>();
const seen: string[] = [];
let refuse = false;

beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://gateway.test");
    seen.push(`${req.method} ${url.pathname}`);
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      res.setHeader("content-type", "application/json");
      if (url.pathname === "/auth/cli/token") {
        const { code, code_verifier: verifier, redirect_uri: redirectUri } = JSON.parse(raw);
        const issued = codes.get(code);
        codes.delete(code);
        const proof = createHash("sha256")
          .update(verifier ?? "")
          .digest("base64url");
        if (!issued || issued.challenge !== proof || issued.redirectUri !== redirectUri) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: { message: "The code is not valid." } }));
          return;
        }
        res.end(JSON.stringify({ token: "fgt.person.token" }));
      } else if (url.pathname === "/whoami") {
        const ok = req.headers.authorization === "Bearer fgt.person.token";
        res.statusCode = ok ? 200 : 401;
        res.end(
          JSON.stringify(
            ok
              ? { name: "Ely", email: "ely@acme.fr", workspace: "acme" }
              : { error: { message: "no" } },
          ),
        );
      } else {
        res.statusCode = 404;
        res.end("{}");
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

const dirs: string[] = [];
const saved = process.env.XDG_CONFIG_HOME;
afterEach(async () => {
  if (saved === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = saved;
  seen.length = 0;
  codes.clear();
  refuse = false;
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

function fakeKeychain(failing = false) {
  const entries = new Map<string, string>();
  const keychain: Keychain = {
    get: async (account) => entries.get(account),
    set: async (account, secret) => {
      if (failing) throw new Error("locked");
      entries.set(account, secret);
    },
    delete: async (account) => void entries.delete(account),
  };
  return { keychain, entries };
}

type Browser = (url: string) => Promise<void>;
/** What the person's browser does: signs in, and comes back on the loopback address. */
const signsIn: Browser = async (url) => {
  const query = new URL(url).searchParams;
  const state = query.get("state");
  if (refuse) {
    await fetch(`${query.get("redirect_uri")}?error=access_denied&state=${state}`);
    return;
  }
  codes.set("one-time-code", {
    challenge: query.get("code_challenge")!,
    redirectUri: query.get("redirect_uri")!,
  });
  await fetch(`${query.get("redirect_uri")}?code=one-time-code&state=${state}`);
};

async function setup(
  options: { keychain?: Keychain; openUrl?: Browser | undefined; linked?: boolean } = {},
) {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-login-"));
  const config = await mkdtemp(join(tmpdir(), "forgeron-config-"));
  dirs.push(cwd, config);
  process.env.XDG_CONFIG_HOME = config;
  if (options.linked !== false) {
    await mkdir(join(cwd, ".forgeron"));
    await writeFile(
      join(cwd, ".forgeron", "project.json"),
      JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
    );
  }
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    cwd,
    log: (m) => void logs.push(m),
    error: (m) => void errors.push(m),
    exec: async () => 0,
    stopped: new Promise(() => {}),
    ...("openUrl" in options
      ? options.openUrl
        ? { openUrl: options.openUrl }
        : {}
      : { openUrl: signsIn }),
    ...(options.keychain ? { keychain: options.keychain } : {}),
  };
  return { io, logs, errors, file: join(config, "forgeron", "credentials") };
}

describe("forgeron login", () => {
  it("opens the browser, trades the code and stores the token in the keychain", async () => {
    const { keychain, entries } = fakeKeychain();
    const { io, logs, file } = await setup({ keychain });
    expect(await run(["login"], io)).toBe(0);
    expect(entries.get("forgeron")).toBe("fgt.person.token");
    expect(logs.join("\n")).toContain("system keychain");
    await expect(stat(file)).rejects.toThrow("ENOENT");
  });

  it("falls back to ~/.config/forgeron/credentials with permissions 600 when there is no keychain", async () => {
    const { io, logs, file } = await setup();
    expect(await run(["login"], io)).toBe(0);
    expect(await readFile(file, "utf8")).toBe("fgt.person.token\n");
    expect((await stat(file)).mode & 0o777).toBe(0o600);
    expect(logs.join("\n")).toContain("permissions 600");
  });

  it("falls back to the file when the keychain refuses", async () => {
    const { keychain, entries } = fakeKeychain(true);
    const { io, file } = await setup({ keychain });
    expect(await run(["login"], io)).toBe(0);
    expect(entries.size).toBe(0);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  it("narrows an existing credentials file that was wider than 600", async () => {
    const { io, file } = await setup();
    await mkdir(join(file, ".."), { recursive: true });
    await writeFile(file, "old\n", { mode: 0o644 });
    expect(await run(["login"], io)).toBe(0);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  });

  it("prints the URL, so a machine with no browser can still sign in", async () => {
    const { io, logs } = await setup({ openUrl: undefined });
    // No browser, so nobody comes back: stop the command the way Ctrl-C would.
    const stop = Promise.resolve();
    expect(await run(["login"], { ...io, stopped: stop })).toBe(1);
    expect(logs.join("\n")).toMatch(new RegExp(`${endpoint}/auth/cli\\?redirect_uri=`));
  });

  it("asks for a PKCE challenge and a state, and lists no secret in the URL", async () => {
    let opened = "";
    const { io } = await setup({
      openUrl: async (url) => {
        opened = url;
        await signsIn(url);
      },
    });
    await run(["login"], io);
    const query = new URL(opened).searchParams;
    expect(query.get("code_challenge_method")).toBe("S256");
    expect(query.get("redirect_uri")).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/callback$/);
    expect(opened).not.toContain("fgt.");
  });

  it("stores nothing when the workspace refuses, or the answer is not for this command", async () => {
    refuse = true;
    const denied = await setup();
    expect(await run(["login"], denied.io)).toBe(1);
    expect(denied.errors.join("\n")).toContain("access_denied");
    await expect(stat(denied.file)).rejects.toThrow("ENOENT");

    refuse = false;
    const forged = await setup({
      openUrl: async (url) => {
        const back = new URL(url).searchParams.get("redirect_uri");
        await fetch(`${back}?code=stolen&state=not-the-state`);
      },
    });
    expect(await run(["login"], forged.io)).toBe(1);
    expect(forged.errors.join("\n")).toContain("not the one this command asked for");
    expect(seen).not.toContain("POST /auth/cli/token");
    await expect(stat(forged.file)).rejects.toThrow("ENOENT");
  });

  it("shows what the workspace says when it will not trade the code", async () => {
    const { io, errors, file } = await setup({
      openUrl: async (url) => {
        const q = new URL(url).searchParams;
        await fetch(`${q.get("redirect_uri")}?code=unknown&state=${q.get("state")}`);
      },
    });
    expect(await run(["login"], io)).toBe(1);
    expect(errors).toEqual(["The code is not valid."]);
    await expect(stat(file)).rejects.toThrow("ENOENT");
  });

  it("needs a workspace: a linked tool, or --workspace", async () => {
    const { io, errors } = await setup({ linked: false });
    expect(await run(["login"], io)).toBe(2);
    expect(errors[0]).toContain("No workspace");
    expect(await run(["login", "--workspace", "www"], io)).toBe(2);
  });
});

describe("forgeron whoami and logout", () => {
  it("whoami shows who the workspace says the token is", async () => {
    const { io, logs } = await setup();
    await run(["login"], io);
    logs.length = 0;
    expect(await run(["whoami"], io)).toBe(0);
    expect(logs).toEqual(["Ely <ely@acme.fr> on acme"]);
  });

  it("whoami is a wrong use when signed out, and asks to sign in again when the token is refused", async () => {
    const { io, errors } = await setup();
    expect(await run(["whoami"], io)).toBe(2);
    await writeCredentials("stale-token");
    expect(await run(["whoami"], io)).toBe(1);
    expect(errors.at(-1)).toContain("run `forgeron login` again");
  });

  it("logout forgets the token in the keychain and in the file", async () => {
    const { keychain, entries } = fakeKeychain();
    const { io, logs, file } = await setup({ keychain });
    await run(["login"], io);
    // An older token left in the file is forgotten too.
    await mkdir(join(file, ".."), { recursive: true });
    await writeFile(file, "older-token\n");
    expect(await run(["logout"], io)).toBe(0);
    expect(entries.size).toBe(0);
    await expect(stat(file)).rejects.toThrow("ENOENT");
    expect(await readCredentials(process.env, keychain)).toBeUndefined();
    expect(await run(["whoami"], io)).toBe(2);
    expect(logs).toContain("Signed out.");
    expect(await run(["logout"], io)).toBe(0);
    expect(logs.at(-1)).toBe("You were not signed in.");
  });

  it("moves a token left in the file to the keychain on first read, and keeps it if the keychain refuses", async () => {
    const { keychain, entries } = fakeKeychain();
    const { file } = await setup();
    await mkdir(join(file, ".."), { recursive: true });
    await writeFile(file, "file-token\n");
    expect(await readCredentials(process.env, keychain)).toBe("file-token");
    expect(entries.get("forgeron")).toBe("file-token");
    await expect(stat(file)).rejects.toThrow("ENOENT");

    await writeFile(file, "other-token\n");
    const refusing = fakeKeychain(true).keychain;
    expect(await readCredentials(process.env, refusing)).toBe("other-token");
    expect(await readFile(file, "utf8")).toBe("other-token\n");
  });

  it("never prints the token", async () => {
    const { io, logs, errors } = await setup();
    await run(["login"], io);
    await run(["whoami"], io);
    await run(["logout"], io);
    expect([...logs, ...errors].join("\n")).not.toContain("fgt.person.token");
  });

  it("keeps no secret in .forgeron/project.json", async () => {
    const { io } = await setup();
    await run(["login"], io);
    expect(await readFile(join(io.cwd, ".forgeron", "project.json"), "utf8")).not.toContain("fgt.");
  });
});
