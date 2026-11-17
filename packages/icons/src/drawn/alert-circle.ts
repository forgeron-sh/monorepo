import type { PixelIcon } from "../types";

// Ring with a two-pixel “!”, centred like the i of `information-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the exclamation mark.
const icon: PixelIcon = {
  name: "alert-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
