#!/usr/bin/env node
// The `forgeron` binary. The commands are specified in docs/sdk.md, section 5.
import { ACCESS_LEVELS } from "@forgeron/sdk";

const [command] = process.argv.slice(2);

if (command === "--version" || command === "-v") {
  console.log("forgeron 0.0.0");
} else {
  console.log(`forgeron: no command implemented (known levels: ${ACCESS_LEVELS.join(", ")}).`);
}
