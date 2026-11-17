import type { PixelIcon } from "../types";

// Cloudy night: a crescent in the secondary tone behind a cloud.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-cloud",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oo",
    "..oo",
    ".oo",
    ".oo",
    ".ooo",
    "..o...###",
    "....##...#",
    "...#......#",
    "...#......#",
    "....######",
  ],
};

export default icon;
