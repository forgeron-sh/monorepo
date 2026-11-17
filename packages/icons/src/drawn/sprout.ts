import type { PixelIcon } from "../types";

// A sprout: two leaves on a short stem above the ground.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sprout",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oooo",
    "......o...o",
    ".oooo.o..o",
    ".o...#ooo",
    "..o..#",
    "...oo#",
    ".....#",
    ".....#",
    ".....#",
    "..########",
  ],
};

export default icon;
