import type { PixelIcon } from "../types";

// Absolute value: two vertical bars around an x in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "absolute",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#........#",
    ".#........#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#........#",
    ".#........#",
  ],
};

export default icon;
