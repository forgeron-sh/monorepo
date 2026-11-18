import type { PixelIcon } from "../types";

// An upward arrow beside 0 over 1.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-0-1",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o...##",
    ".ooo.#..#",
    "o.o.o#..#",
    "..o...##",
    "..o",
    "..o",
    "..o...#",
    "..o..##",
    "..o...#",
    "..o..###",
  ],
};

export default icon;
