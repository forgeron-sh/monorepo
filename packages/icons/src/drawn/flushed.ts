import type { PixelIcon } from "../types";

// Flushed face: the round face of `smile`, wide square eyes, a small round mouth and blushing cheeks in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flushed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.##..##.#",
    ".#.##..##.#",
    ".#........#",
    ".#oo.##.oo#",
    ".#...##...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
