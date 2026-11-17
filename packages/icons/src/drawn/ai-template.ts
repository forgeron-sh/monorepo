import type { PixelIcon } from "../types";

// AI template: a page layout with a header and a sidebar, the AI sparkle badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-template",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##########",
    "#........#",
    "##########",
    "#...#....#",
    "#...#....#",
    "#...#",
    "#...#....o",
    "#...#...ooo",
    "#...#..ooooo",
    "#####...ooo",
    ".........o",
  ],
};

export default icon;
