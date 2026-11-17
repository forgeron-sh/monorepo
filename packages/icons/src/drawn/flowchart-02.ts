import type { PixelIcon } from "../types";

// Flowchart: a box branching into two boxes through connectors in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flowchart-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...#####",
    "...#...#",
    "...#####",
    ".....o",
    "..ooooooo",
    "..o.....o",
    "#####.#####",
    "#...#.#...#",
    "#####.#####",
  ],
};

export default icon;
