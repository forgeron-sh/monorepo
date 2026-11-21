import type { PixelIcon } from "../types";

// The Microsoft Teams mark in pixels: the T plaque in front, two people behind it in the secondary
// tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "microsoft-teams",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....ooo",
    ".....ooo.oo",
    ".....ooo.oo",
    "#######.oooo",
    "#.....#ooooo",
    "###.###ooooo",
    "###.###ooooo",
    "###.###oooo",
    "###.###ooo",
    "#######",
  ],
};

export default icon;
