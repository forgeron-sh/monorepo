import type { PixelIcon } from "../types";

// The Apple News mark in pixels: a rounded square crossed by the diagonal bands of its “N”.
// 12×12: `#` primary tone. Rasterised from `simple-icons:applenews` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Apple News and the Apple News logo are trademarks of Apple Inc., used here only to refer to Apple News.
const icon: PixelIcon = {
  name: "apple-news",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".###...####",
    "#####...####",
    "######...###",
    "#######...##",
    ".#######...#",
    "..#######",
    "...#######",
    "#...#######",
    "##...#######",
    "###...######",
    "####...#####",
    ".####...###",
  ],
};

export default icon;
