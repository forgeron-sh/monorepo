import type { PixelIcon } from "../types";

// Arrow pointing up and right, heavier than `arrow-up-right-01`: a solid corner head and a shaft of
// two-pixel runs, the weight of the `-02` arrows; 8×8 and centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-right-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....######",
    ".....#####",
    "......####",
    "......####",
    ".....##.##",
    "....##...#",
    "...##",
    "..##",
  ],
};

export default icon;
