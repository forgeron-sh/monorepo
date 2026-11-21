import type { PixelIcon } from "../types";

// Two check marks side by side: delivered, not yet read.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "check-unread-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "........#..#",
    ".......#..#",
    ".#....#..#",
    "..#..#..#",
    "...##..#",
    "....#.#",
  ],
};

export default icon;
