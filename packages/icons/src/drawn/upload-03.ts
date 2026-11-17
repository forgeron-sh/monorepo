import type { PixelIcon } from "../types";

// Upload to the top: the thin arrow of `upload-01` in the secondary tone rising to a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "upload-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#########",
    "",
    ".....o",
    "....ooo",
    "...o.o.o",
    "..o..o..o",
    ".....o",
    ".....o",
    ".....o",
    ".....o",
  ],
};

export default icon;
