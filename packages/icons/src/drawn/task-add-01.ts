import type { PixelIcon } from "../types";

// Task list with a plus badge: task-01 with its second line replaced by the badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "task-add-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".###",
    ".#.#..#####",
    ".###",
    "",
    "........o",
    ".###....o",
    ".#.#..ooooo",
    ".###....o",
    "........o",
  ],
};

export default icon;
