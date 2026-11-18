import type { PixelIcon } from "../types";

// Arrow pointing right away from a bar on the left, the bar in the secondary tone: `arrow-down-from-line` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-right-from-line",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "o",
    "o",
    "o......#",
    "o......##",
    "o.########",
    "o.########",
    "o......##",
    "o......#",
    "o",
    "o",
  ],
};

export default icon;
