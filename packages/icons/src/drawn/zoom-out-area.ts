import type { PixelIcon } from "../types";

// Four corners of a frame around a minus in the secondary tone: zoom out of the area. Built on `zoom-in-area`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zoom-out-area",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "",
    "...oooooo",
    "...oooooo",
    "",
    ".#........#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
