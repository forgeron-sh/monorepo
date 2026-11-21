import type { PixelIcon } from "../types";

// The `plug-01` plug, moved left, with a lightning bolt badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plug-zap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#..#",
    "..#..#",
    "########",
    "#......#",
    "#......#",
    ".#....#",
    "..####.....o",
    "...##.....o",
    "...##....ooo",
    "...##.....o",
    ".........o",
  ],
};

export default icon;
