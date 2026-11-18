import type { PixelIcon } from "../types";

// Shared drive: the hard drive of `hard-drive` with a share arrow in the secondary tone in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shared-drive",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    "#........#",
    "##########",
    "#.##.....#",
    ".########",
    "",
    "........ooo",
    ".........oo",
    "........o.o",
    ".......o",
    "......o",
  ],
};

export default icon;
