import type { PixelIcon } from "../types";

// A spotlight hanging at the top, casting a cone of light to the floor.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "spotlight",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "...######",
    "...o....o",
    "..o......o",
    "..o......o",
    ".o........o",
    ".o........o",
    "o..........o",
    ".oooooooooo",
  ],
};

export default icon;
