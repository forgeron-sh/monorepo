import type { PixelIcon } from "../types";

// Two boxes stacked, a guide on the top edge of each.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "distribute-vertical-top",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".oooooooooo",
    "",
    "...######",
    "...#....#",
    "...######",
    "",
    ".oooooooooo",
    "",
    "..########",
    "..#......#",
    "..########",
  ],
};

export default icon;
