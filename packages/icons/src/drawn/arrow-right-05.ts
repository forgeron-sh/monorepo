import type { PixelIcon } from "../types";

// Arrow pointing right: `arrow-down-05` turned a quarter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-right-05",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "......##",
    "......###",
    "......####",
    ".##########",
    ".##########",
    "......####",
    "......###",
    "......##",
    "......#",
  ],
};

export default icon;
