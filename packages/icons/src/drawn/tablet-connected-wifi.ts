import type { PixelIcon } from "../types";

// Tablet with a Wi-Fi badge in the secondary tone, lower right. Built on `tablet-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tablet-connected-wifi",
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
    "..#....oooo",
    "..#...o....o",
    "..#.....oo",
    "..#",
    "...##...oo",
  ],
};

export default icon;
