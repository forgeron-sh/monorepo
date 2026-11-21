import type { PixelIcon } from "../types";

// A square whose top right corner is a wider arc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-round-corner",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###.oo",
    ".#......o",
    ".#.......o",
    ".#........o",
    ".#........o",
    ".#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
