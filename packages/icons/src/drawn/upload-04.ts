import type { PixelIcon } from "../types";

// Upload: a two-pixel arrow in the secondary tone, with a solid stepped head, over an open tray.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "upload-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...oooooo",
    ".....oo",
    ".....oo",
    ".....oo",
    ".....oo",
    "",
    ".#........#",
    ".##########",
  ],
};

export default icon;
