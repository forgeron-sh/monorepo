import type { PixelIcon } from "../types";

// Crescent moon behind a cloud, two snowflakes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-cloud-mid-snow",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..##",
    ".##",
    "##....###",
    "##..##...#",
    ".###......#",
    "...#......#",
    "....######",
    "",
    ".....o...o",
    "....ooo.ooo",
    ".....o...o",
  ],
};

export default icon;
