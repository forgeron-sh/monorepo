import type { PixelIcon } from "../types";

// Solid flame with a side tongue, its core in the secondary tone; the solid counterpart of `fire`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fire-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "....###",
    "....###.#",
    "...######",
    "...######",
    "..########",
    "..###oo###",
    "..##oooo##",
    "..##oooo##",
    "...######",
  ],
};

export default icon;
