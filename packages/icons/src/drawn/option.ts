import type { PixelIcon } from "../types";

// The option key symbol: a left bar, a falling diagonal to a lower bar, a separate upper bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "option",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    ".###...####",
    "....#",
    ".....#",
    "......#",
    ".......####",
  ],
};

export default icon;
