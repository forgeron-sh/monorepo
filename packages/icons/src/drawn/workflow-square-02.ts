import type { PixelIcon } from "../types";

// Workflow: a square start node in the secondary tone branching to two square nodes. Built on `workflow-square-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "workflow-square-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....ooo",
    "....o.o",
    "....ooo",
    ".....#",
    ".....#",
    "..#######",
    "..#.....#",
    ".###...###",
    ".#.#...#.#",
    ".###...###",
  ],
};

export default icon;
