import type { PixelIcon } from "../types";

// Gallery with thumbnails: a large card above a row of three small thumbnails.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gallery-thumbnails",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    "",
    ".oo..oo..oo",
    ".oo..oo..oo",
  ],
};

export default icon;
