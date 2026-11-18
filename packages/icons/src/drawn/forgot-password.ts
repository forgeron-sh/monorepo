import type { PixelIcon } from "../types";

// Forgotten password: the masked field of `reset-password` and the question mark of `folder-unknown` as a badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "forgot-password",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "#..........#",
    "#.##.##.##.#",
    "#.##.##.##.#",
    "#..........#",
    "#######",
    "........ooo",
    "...........o",
    ".........oo",
    "",
    ".........o",
  ],
};

export default icon;
