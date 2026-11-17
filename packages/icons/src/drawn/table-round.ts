import type { PixelIcon } from "../types";

// Round pedestal table seen from the side: an oval top on a single column and a foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "table-round",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#........#",
    "..########",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
