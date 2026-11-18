import type { PixelIcon } from "../types";

// List settings: three lines and the cog badge of file-cog in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-setting",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "",
    "",
    ".##########",
    "",
    "........o.o",
    ".####..ooooo",
    ".......oo.oo",
    ".......ooooo",
    "........o.o",
  ],
};

export default icon;
