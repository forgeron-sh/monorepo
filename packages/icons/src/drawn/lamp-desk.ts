import type { PixelIcon } from "../types";

// Desk lamp: a base, a jointed arm and a shade with its bulb.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lamp-desk",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......###",
    ".....#...#",
    "....#######",
    "...#..ooo",
    "..#",
    "...#",
    "....#",
    "....#",
    "....#",
    "..#####",
  ],
};

export default icon;
