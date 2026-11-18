import type { PixelIcon } from "../types";

// Piggy bank seen from the side: ear, snout, tail and legs, a coin dropping into the slot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "piggy-bank",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...oo",
    "...oo",
    "......##",
    "...######",
    "..#......#",
    "##........##",
    ".#.........#",
    ".#........##",
    "..#......#",
    "...######",
    "...#....#",
  ],
};

export default icon;
