#!/usr/bin/env node
// The `forgeron` binary. The commands are specified in docs/sdk.md, section 5.
import { resolve } from "node:path";
import { startDev } from "./dev";
import { watchSources } from "./watch";

const [command, ...args] = process.argv.slice(2);

async function dev(): Promise<void> {
  const portFlag = args.indexOf("--port");
  const port = portFlag === -1 ? undefined : Number(args[portFlag + 1]);
  const dir = resolve(
    args.find((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--port") ?? ".",
  );

  const session = await startDev(dir, port === undefined ? {} : { port });
  console.log(`${session.name} runs at ${session.url}`);
  console.log(`  MCP  ${session.url}/mcp`);
  console.log(`  API  ${session.url}/api/<action>`);
  console.log(`  CLI  ${session.url}/cli`);

  const stopWatching = watchSources(dir, () => {
    session.reload().then(
      () => console.log("rebuilt"),
      (error: unknown) =>
        console.error(`build failed, still serving the previous build:\n${String(error)}`),
    );
  });
  process.once("SIGINT", () => {
    stopWatching();
    void session.stop().then(() => process.exit(0));
  });
}

if (command === "--version" || command === "-v") {
  console.log("forgeron 0.0.0");
} else if (command === "dev") {
  await dev();
} else {
  console.log("forgeron: only `forgeron dev [dir] [--port n]` is implemented so far.");
}
