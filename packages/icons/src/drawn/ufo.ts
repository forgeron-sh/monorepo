import type { PixelIcon } from "../types";

// UFO: a domed saucer, the light beam below in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ufo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    ".###....###",
    "#..........#",
    ".##########",
    "",
    "...o....o",
    "..o......o",
    ".o........o",
  ],
};

export default icon;
