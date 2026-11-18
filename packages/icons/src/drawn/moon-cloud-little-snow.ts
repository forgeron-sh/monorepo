import type { PixelIcon } from "../types";

// Crescent moon behind a cloud, one snowflake in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-cloud-little-snow",
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
    ".......o",
    "......ooo",
    ".......o",
  ],
};

export default icon;
