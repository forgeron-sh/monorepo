import type { PixelIcon } from "../types";

// C++: a letter C followed by two plus signs in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cpp",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".###",
    "#.....o...o",
    "#....ooo.ooo",
    "#.....o...o",
    "#",
    ".###",
  ],
};

export default icon;
