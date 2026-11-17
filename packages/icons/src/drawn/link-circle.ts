import type { PixelIcon } from "../types";

// External link in a circle: the ring of `smile` open at its upper right, a 45° arrow leaving it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "link-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###.oooo",
    "..#......oo",
    ".#......o.o",
    ".#.....o",
    ".#....o...#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
