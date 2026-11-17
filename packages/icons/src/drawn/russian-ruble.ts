import type { PixelIcon } from "../types";

// Russian ruble sign: a P with a bar across its stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "russian-ruble",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....######",
    "....#.....#",
    "....#.....#",
    "....#.....#",
    "....######",
    "....#",
    "..######",
    "....#",
    "....#",
    "....#",
  ],
};

export default icon;
