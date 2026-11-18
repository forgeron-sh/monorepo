import type { PixelIcon } from "../types";

// The rosette of `badge` with a Turkish lira sign inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "badge-turkish-lira",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#..o...#",
    "..#.ooo..#",
    ".#...o....#",
    ".#..ooo...#",
    "..#..o.o.#",
    "..#..oo..#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
