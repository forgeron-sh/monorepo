import type { PixelIcon } from "../types";

// Live: a dot in the secondary tone between two pairs of arcs, symmetric.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "live-streaming-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#......#",
    ".#........#",
    "#..#....#..#",
    "#.#..oo..#.#",
    "#.#..oo..#.#",
    "#..#....#..#",
    ".#........#",
    "..#......#",
  ],
};

export default icon;
