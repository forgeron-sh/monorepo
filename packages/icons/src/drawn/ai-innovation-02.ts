import type { PixelIcon } from "../types";

// AI innovation: a light bulb, the AI sparkle badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-innovation-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    ".#....#",
    "#......#",
    "#......#",
    "#......#",
    ".#....#",
    "..#..#...o",
    "..####..ooo",
    "..####.ooooo",
    "...##...ooo",
    ".........o",
  ],
};

export default icon;
