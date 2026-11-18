import type { PixelIcon } from "../types";

// A window with a title bar and code brackets.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "software",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
