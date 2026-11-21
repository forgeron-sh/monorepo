import type { PixelIcon } from "../types";

// Archive box: a lid, a box, the handle slot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "archive-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#........#",
    ".##########",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
