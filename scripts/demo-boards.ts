// Writes the demo documents of the canvas editors into packages/libraries/boards/: the
// "Q1 product workshop" whiteboard (`forgeron/draw`) and the "Order-to-cash automation" flow.
// Seeded, so the same run gives the same files; oxfmt then lays them out like every JSON file.
//   bun scripts/demo-boards.ts
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { orderToCash } from "./demo/order-to-cash";
import { q1Workshop } from "./demo/workshop";

export const BOARDS_DIR = join(import.meta.dirname, "../packages/libraries/boards");
export const WORKSHOP_FILE = join(BOARDS_DIR, "q1-workshop.draw.json");
export const ORDER_TO_CASH_FILE = join(BOARDS_DIR, "order-to-cash.flow.json");

if (import.meta.main) {
  mkdirSync(BOARDS_DIR, { recursive: true });
  const board = q1Workshop();
  writeFileSync(WORKSHOP_FILE, board.json);
  const flow = orderToCash();
  writeFileSync(ORDER_TO_CASH_FILE, flow.json);
  const fmt = spawnSync("bunx", ["oxfmt", WORKSHOP_FILE, ORDER_TO_CASH_FILE], { stdio: "inherit" });
  if (fmt.status !== 0) process.exit(fmt.status ?? 1);
  console.log(
    `q1-workshop: ${board.items.length} items · order-to-cash: ${flow.graph.nodes.length} nodes, ${flow.graph.edges.length} edges`,
  );
}
