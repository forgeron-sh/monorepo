import type { PixelIcon } from "../types";

// Sort A to Z: a down arrow in the secondary tone beside the letters A and Z.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-a-z",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..o...##",
    "..o..#..#",
    "..o..####",
    "..o..#..#",
    "..o",
    "..o",
    "..o..####",
    "o.o.o..#",
    ".ooo..#",
    "..o..####",
  ],
};

export default icon;
