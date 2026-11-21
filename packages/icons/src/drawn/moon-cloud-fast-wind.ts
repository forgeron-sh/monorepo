import type { PixelIcon } from "../types";

// Crescent moon behind a cloud, two long wind lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-cloud-fast-wind",
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
    "..oooooooo",
    "",
    "....oooooooo",
  ],
};

export default icon;
