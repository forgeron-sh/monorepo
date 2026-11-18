import type { PixelIcon } from "../types";

// Two stacked bars with a marker pointing between them from the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "between-horizontal-end",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "########",
    "#......#",
    "#......#...o",
    "########..oo",
    ".........ooo",
    ".........ooo",
    "########..oo",
    "#......#...o",
    "#......#",
    "########",
  ],
};

export default icon;
