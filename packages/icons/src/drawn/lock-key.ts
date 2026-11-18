import type { PixelIcon } from "../types";

// Padlock with a key lying in its body, the key in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lock-key",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#.oo..o..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
