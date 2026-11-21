import type { PixelIcon } from "../types";

// Swimming pool: a ladder with hooked rails over two rows of waves in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pool",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...##",
    "....#....#",
    "....#....#",
    "....######",
    "....#....#",
    "....#....#",
    "",
    ".oo..oo..oo",
    "o..oo..oo..o",
  ],
};

export default icon;
