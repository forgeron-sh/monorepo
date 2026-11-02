#!/usr/bin/env node
// The `forgeron` binary. The commands are specified in docs/sdk.md, section 5.
import { run } from "./cli";
import { terminal } from "./io";

process.exitCode = await run(process.argv.slice(2), terminal());
