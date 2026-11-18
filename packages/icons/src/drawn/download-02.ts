import type { PixelIcon } from "../types";

// Arrow down in the secondary tone onto a baseline: the arrow of `arrow-down-02` over a ground line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "download-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    ".....oo",
    "..o..oo..o",
    "..oo.oo.oo",
    "...oooooo",
    "....oooo",
    ".....oo",
    "",
    ".##########",
  ],
};

export default icon;
