import type { PixelIcon } from "../types";

// Crescent moon behind a cloud, heavy rain in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-cloud-big-rain",
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
    "....o..o..o",
    "....o..o..o",
    "....o..o..o",
  ],
};

export default icon;
