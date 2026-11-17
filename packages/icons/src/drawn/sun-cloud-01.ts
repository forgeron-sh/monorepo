import type { PixelIcon } from "../types";

// Partly sunny: a solid sun in the secondary tone behind a cloud.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-cloud-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..ooo",
    ".ooooo",
    ".ooooo",
    ".oooo",
    "..o...###",
    "....##...#",
    "...#......#",
    "...#......#",
    "....######",
  ],
};

export default icon;
