import type { PixelIcon } from "../types";

// Face with lowered closed eyes and a small frown in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pensive",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#.##..##.#",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
