import type { PixelIcon } from "../types";

// The Android robot head in pixels: the half dome with its two antennae and its two eyes.
// 12×12: `#` primary tone. Rasterised from `simple-icons:android` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Android and the Android robot logo are trademarks of Google LLC, used here only to refer to Android.
const icon: PixelIcon = {
  name: "android",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#......#",
    "...#....#",
    "...######",
    "..########",
    ".##.####.##",
    ".##########",
    "############",
    "############",
  ],
};

export default icon;
