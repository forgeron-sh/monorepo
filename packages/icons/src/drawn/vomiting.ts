import type { PixelIcon } from "../types";

// A face being sick, the spill in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "vomiting",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..#......#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    "..#..oo..#",
    "...#oooo#",
    "....oooo",
    "...oooooo",
    "..oooooooo",
  ],
};

export default icon;
