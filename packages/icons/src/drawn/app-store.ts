import type { PixelIcon } from "../types";

// The App Store mark in pixels: the “A” built of crossed sticks over a bar.
// 12×12: `#` primary tone. Rasterised from `simple-icons:appstore` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// App Store and the App Store logo are trademarks of Apple Inc., used here only to refer to App Store.
const icon: PixelIcon = {
  name: "app-store",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#..#",
    ".....##",
    ".....##",
    "....#..#",
    "....#..#",
    "...#....#",
    "############",
    "############",
    "..#......#",
    ".#........#",
    "#..........#",
  ],
};

export default icon;
