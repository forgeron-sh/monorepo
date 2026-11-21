import type { PixelIcon } from "../types";

// Two axes with arrowheads and a point placed between them.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coordinate-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    "#.#",
    ".#",
    ".#.....oo",
    ".#.....oo",
    ".#",
    ".#",
    ".#",
    ".#........#",
    ".##########",
    "..........#",
  ],
};

export default icon;
