import type { PixelIcon } from "../types";

// X with a bar on top: the sample mean, a cross in the secondary tone under an overline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "x-line-top",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "",
    "",
    "...o....o",
    "....o..o",
    ".....oo",
    ".....oo",
    "....o..o",
    "...o....o",
  ],
};

export default icon;
