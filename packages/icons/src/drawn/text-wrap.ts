import type { PixelIcon } from "../types";

// Text wrap: a line of text that turns back under itself as an arrow.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-wrap",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".#######oo",
    "..........o",
    ".......o..o",
    ".###..oooo",
    ".......o",
  ],
};

export default icon;
