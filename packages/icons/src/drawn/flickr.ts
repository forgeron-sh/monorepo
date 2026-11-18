import type { PixelIcon } from "../types";

// The Flickr mark: two dots side by side, the second in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "flickr",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".###...ooo",
    "#####.ooooo",
    "#####.ooooo",
    "#####.ooooo",
    ".###...ooo",
  ],
};

export default icon;
