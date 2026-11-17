import type { PixelIcon } from "../types";

// Speech bubble (`message-add-01` base), cut at the lower right for an open padlock badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-unlock-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#.....ooo",
    "..#....o",
    "..#.#.ooooo",
    "..##..ooooo",
    "......ooooo",
  ],
};

export default icon;
