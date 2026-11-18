import type { PixelIcon } from "../types";

// Search in a list: three lines, the lower two short, and a small magnifier in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-list-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "",
    "",
    ".####..oo",
    "......o..o",
    "......o..o",
    ".####..oo",
    ".........o",
    "..........o",
  ],
};

export default icon;
