import type { PixelIcon } from "../types";

// Two kitchen knives crossed.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "knives",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    ".##......##",
    ".###....###",
    "..###..###",
    "...######",
    "....####",
    "",
    "...##.##",
    "..##...##",
    ".##.....##",
  ],
};

export default icon;
