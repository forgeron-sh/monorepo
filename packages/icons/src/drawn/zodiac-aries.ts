import type { PixelIcon } from "../types";

// Aries: two curled horns meeting on a stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-aries",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##....##",
    ".#..#..#..#",
    ".#...##...#",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
