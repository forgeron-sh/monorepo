import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { startDev, type DevOptions, type DevSession } from "./dev";
import { PLAYGROUND_HTML } from "./play-page";

// `forgeron play`: the tool runs as in `forgeron dev`, and a playground is served in front of it.
// The playground is the CLI's own page; every other request goes to the tool, so the page calls
// the API on its own origin.

export interface PlaySession {
  name: string;
  /** Where the playground answers. */
  url: string;
  /** The tool behind it. */
  dev: DevSession;
  reload(): Promise<void>;
  stop(): Promise<void>;
}

export interface PlayOptions extends DevOptions {
  /** The port of the playground; free port by default. The tool takes its own free one. */
  playPort?: number;
}

async function readBody(request: IncomingMessage): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export async function startPlay(dir: string, options: PlayOptions = {}): Promise<PlaySession> {
  const { playPort, ...devOptions } = options;
  const dev = await startDev(dir, { ...devOptions, port: 0 });

  const server: Server = createServer(async (incoming, outgoing) => {
    try {
      const path = new URL(incoming.url ?? "/", "http://playground").pathname;
      if (path === "/" && incoming.method === "GET") {
        outgoing.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        outgoing.end(PLAYGROUND_HTML);
        return;
      }
      if (path === "/_play/manifest") {
        outgoing.writeHead(200, { "content-type": "application/json" });
        outgoing.end(JSON.stringify(dev.manifest()));
        return;
      }
      const body = await readBody(incoming);
      const response = await fetch(`${dev.url}${incoming.url ?? "/"}`, {
        method: incoming.method ?? "GET",
        headers: {
          "content-type": incoming.headers["content-type"] ?? "application/json",
          ...(incoming.headers.accept ? { accept: incoming.headers.accept } : {}),
        },
        ...(body ? { body } : {}),
      });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      outgoing.writeHead(502, { "content-type": "application/json" });
      outgoing.end(JSON.stringify({ error: { code: "INTERNAL", message: String(error) } }));
    }
  });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(playPort ?? 0, "127.0.0.1", resolve);
    });
  } catch (error) {
    await dev.stop();
    throw error;
  }
  const { port } = server.address() as AddressInfo;
  return {
    name: dev.name,
    url: `http://127.0.0.1:${port}`,
    dev,
    reload: () => dev.reload(),
    stop: async () => {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
      await dev.stop();
    },
  };
}
