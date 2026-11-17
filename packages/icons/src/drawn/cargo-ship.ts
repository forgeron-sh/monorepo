import type { PixelIcon } from "../types";

// Cargo ship: a hull with a bridge tower and two stacks of containers in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cargo-ship",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "........###",
    "........#.#",
    "..oo.oo.#.#",
    "..oo.oo.#.#",
    "..oo.oo.#.#",
    "############",
    ".#........#",
    "..########",
  ],
};

export default icon;
