import type { PixelIcon } from "../types";

// Soil temperature: a thermometer with its mercury in the secondary tone over layers of soil.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "soil-temperature-field",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "....#..#",
    "....#oo#",
    "....#oo#",
    "...#oooo#",
    "...#oooo#",
    "....####",
    "",
    ".##########",
    "",
    ".##..##..##",
  ],
};

export default icon;
