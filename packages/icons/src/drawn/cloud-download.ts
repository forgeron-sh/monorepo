import type { PixelIcon } from "../types";

// Download from the cloud: `cloud-upload` with the arrow dropping out through the base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-download",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "..###....#",
    ".#...oo...#",
    "#....oo....#",
    "#....oo....#",
    "#....oo....#",
    ".##.oooo.##",
    ".....oo",
  ],
};

export default icon;
