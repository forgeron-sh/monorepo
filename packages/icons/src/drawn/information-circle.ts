import type { PixelIcon } from "../types";

// Ring with a two-pixel-wide “i”, centred in the ring of `clock-01` (a one-pixel i sat half a
// pixel left).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the i.
const icon: PixelIcon = {
  name: "information-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
