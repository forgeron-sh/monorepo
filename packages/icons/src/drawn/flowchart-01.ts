import type { PixelIcon } from "../types";

// Flowchart: a decision diamond branching to two boxes, the links in the secondary tone; the boxes of `flowchart-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flowchart-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "....#.#",
    "...#...#",
    "....#.#",
    ".....#",
    ".....o",
    "..ooooooo",
    "..o.....o",
    "#####.#####",
    "#...#.#...#",
    "#####.#####",
  ],
};

export default icon;
