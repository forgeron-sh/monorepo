import type { PixelIcon } from "../types";

// Dollar in the ring of `clock-01`: an S and its bar in the secondary tone, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dollar-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..ooooo.#",
    ".#.o.oo...#",
    ".#...oo.o.#",
    ".#.ooooo..#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
