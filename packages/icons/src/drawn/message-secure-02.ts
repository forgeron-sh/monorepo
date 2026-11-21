import type { PixelIcon } from "../types";

// Speech bubble (`message-add-01` base), cut at the lower right for a shield badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "message-secure-02",
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
    ".#....ooooo",
    "..#...ooooo",
    "..#.#.ooooo",
    "..##...ooo",
    "........o",
  ],
};

export default icon;
