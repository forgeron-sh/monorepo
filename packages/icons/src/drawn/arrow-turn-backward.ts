import type { PixelIcon } from "../types";

// Arrow rising on the right and turning left at a 45° corner, with the one-pixel head of `arrow-up-down`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-turn-backward",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "..#",
    ".########",
    "..#......#",
    "...#......#",
    "..........#",
    "..........#",
    "..........#",
    "..........#",
    "..........#",
  ],
};

export default icon;
