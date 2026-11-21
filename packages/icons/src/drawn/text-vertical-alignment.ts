import type { PixelIcon } from "../types";

// Vertical alignment: two letters A with their lines, above and below a middle axis in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-vertical-alignment",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##..#####",
    ".#..#",
    ".####.#####",
    ".#..#",
    "",
    ".oooooooooo",
    "",
    "..##..#####",
    ".#..#",
    ".####.#####",
    ".#..#",
  ],
};

export default icon;
