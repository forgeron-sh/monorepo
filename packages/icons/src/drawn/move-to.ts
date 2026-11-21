import type { PixelIcon } from "../types";

// A list of two lines and a third moving right, its arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "move-to",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#.########",
    "",
    "",
    ".#.########",
    "",
    ".........o",
    ".#.oooooooo",
    ".........o",
  ],
};

export default icon;
