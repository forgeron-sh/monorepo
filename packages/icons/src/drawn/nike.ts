import type { PixelIcon } from "../types";

// The Nike swoosh in pixels: a small hook on the left sweeping up to a thin point on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "nike",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...........#",
    ".........##",
    "#......###",
    "#....####",
    "##.####",
    ".####",
  ],
};

export default icon;
