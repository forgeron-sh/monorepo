import type { PixelIcon } from "../types";

// One period of a cosine wave above an axis.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cosine-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "oo........oo",
    "..o......o",
    "...o....o",
    "...o....o",
    "....o..o",
    ".....oo",
    "",
    "############",
  ],
};

export default icon;
