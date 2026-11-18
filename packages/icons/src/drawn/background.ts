import type { PixelIcon } from "../types";

// Background: a rounded square filled with diagonal hatching in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "background",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#o..o..o.#",
    ".#..o..o..#",
    ".#.o..o..o#",
    ".#o..o..o.#",
    ".#..o..o..#",
    ".#.o..o..o#",
    ".#o..o..o.#",
    ".#..o..o..#",
    "..########",
  ],
};

export default icon;
