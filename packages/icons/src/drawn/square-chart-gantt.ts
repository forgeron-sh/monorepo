import type { PixelIcon } from "../types";

// Three staggered Gantt bars in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-chart-gantt",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.ooo....#",
    ".#........#",
    ".#..oooo..#",
    ".#........#",
    ".#....ooo.#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
