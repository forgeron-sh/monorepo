import type { PixelIcon } from "../types";

// The Google Chrome mark in pixels: a disc split into three by curved cuts around a central dot.
// 12×12: `#` primary tone. Rasterised from `simple-icons:googlechrome` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Google Chrome and the Chrome logo are trademarks of Google LLC, used here only to refer to Google Chrome.
const icon: PixelIcon = {
  name: "chrome",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..########",
    "..#########",
    "#.##",
    "#....##..###",
    "##..####.###",
    "###.####.###",
    "###..##..###",
    "####....####",
    ".#####..###",
    "..####.###",
    "...##.###",
  ],
};

export default icon;
