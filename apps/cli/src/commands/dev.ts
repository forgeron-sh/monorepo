import { parseArgs } from "node:util";
import { startDev } from "../dev";
import { UsageError, type Io } from "../io";
import { watchSources } from "../watch";

const DEFAULT_PORT = 8787;

/** `forgeron dev [--as <role>] [--user <email>] [--port 8787]`: runs the tool locally until it is stopped. */
export async function dev(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { as: { type: "string" }, port: { type: "string" }, user: { type: "string" } },
  });
  if (positionals.length > 0)
    throw new UsageError("Usage: forgeron dev [--as <role>] [--user <email>] [--port 8787]");
  const port = values.port === undefined ? DEFAULT_PORT : Number(values.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new UsageError(`--port ${values.port}: not a port number.`);
  }

  const session = await startDev(io.cwd, {
    port,
    ...(values.as ? { role: values.as } : {}),
    ...(values.user ? { user: values.user } : {}),
  }).catch((error: unknown) => {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      throw new UsageError(`Port ${port} is already in use: pick another with --port.`);
    }
    throw error;
  });

  io.log(
    `${session.name} runs at ${session.url}${values.as ? ` as "${values.as}"` : ""}${values.user ? ` for ${values.user}` : ""}`,
  );
  io.log(`  MCP  ${session.url}/mcp`);
  io.log(`  API  ${session.url}/api/<action>`);
  io.log(`  CLI  ${session.url}/cli`);
  if (session.manifest().realtime) {
    io.log(
      `  Live ws://${session.url.replace(/^https?:\/\//, "")}/_f/realtime  (channels: ${Object.keys(session.manifest().realtime!.channels).join(", ")})`,
    );
  }
  for (const view of Object.values(session.manifest().views)) {
    io.log(`  Web  ${session.url}${view.path === "/" ? "/" : view.path}  (${view.title})`);
  }

  const stopWatching = watchSources(io.cwd, () => {
    session.reload().then(
      () => io.log("rebuilt"),
      (error: unknown) =>
        io.error(`build failed, still serving the previous build:\n${String(error)}`),
    );
  });
  await io.stopped;
  stopWatching();
  await session.stop();
  return 0;
}
