import { parseArgs } from "node:util";
import { startPlay } from "../play";
import { UsageError, type Io } from "../io";
import { watchSources } from "../watch";

const DEFAULT_PORT = 8788;

const opener = () =>
  process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";

/** `forgeron play [--as <role>] [--port 8788] [--no-open]`: the playground of the tool, until stopped. */
export async function play(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      as: { type: "string" },
      port: { type: "string" },
      "no-open": { type: "boolean" },
    },
  });
  if (positionals.length > 0)
    throw new UsageError("Usage: forgeron play [--as <role>] [--port 8788] [--no-open]");
  const port = values.port === undefined ? DEFAULT_PORT : Number(values.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new UsageError(`--port ${values.port}: not a port number.`);
  }

  const session = await startPlay(io.cwd, {
    playPort: port,
    ...(values.as ? { role: values.as } : {}),
  }).catch((error: unknown) => {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "EADDRINUSE") {
      throw new UsageError(`Port ${port} is already in use: pick another with --port.`);
    }
    throw error;
  });

  io.log(`Playground of ${session.name}: ${session.url}`);
  if (!values["no-open"]) await io.exec(opener(), [session.url], io.cwd).catch(() => 1);

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
