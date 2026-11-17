import type { PixelIcon } from "../types";

// Tablet with a USB plug and cable badge in the secondary tone, lower right. Built on `tablet-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tablet-connected-usb",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#",
    "..#....ooo",
    "..#....o.o",
    "..#...ooooo",
    "..#....ooo",
    "...##...o",
  ],
};

export default icon;
