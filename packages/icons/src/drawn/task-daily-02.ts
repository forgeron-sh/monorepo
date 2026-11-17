import type { PixelIcon } from "../types";

// Daily task: the boxes of `task-01` with a calendar badge in the secondary tone in place of the second task's line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "task-daily-02",
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
    "......ooooo",
    ".###..ooooo",
    ".#.#..o...o",
    ".###..o...o",
    "......ooooo",
  ],
};

export default icon;
