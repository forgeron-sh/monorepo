#!/usr/bin/env node
// Binaire `forgeron`. Les commandes sont spécifiées dans docs/sdk.md, section 5.
import { ACCESS_LEVELS } from "@forgeron/sdk";

const [command] = process.argv.slice(2);

if (command === "--version" || command === "-v") {
  console.log("forgeron 0.0.0");
} else {
  console.log(
    `forgeron : aucune commande implémentée (niveaux connus : ${ACCESS_LEVELS.join(", ")}).`,
  );
}
