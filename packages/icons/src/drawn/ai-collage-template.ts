import type { PixelIcon } from "../types";

// AI collage: three picture tiles and the AI sparkle badge in the fourth corner, secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-collage-template",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
    "",
    "",
    ".####....o",
    ".#..#...ooo",
    ".#..#..ooooo",
    ".####...ooo",
    ".........o",
  ],
};

export default icon;
