import type { PixelIcon } from "../types";

// The Microsoft Bing mark in pixels: the tall stem whose foot folds into a pointed bowl.
// 12×12: `#` primary tone. Rasterised from `simple-icons:microsoftbing` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Microsoft Bing and the Microsoft Bing logo are trademarks of Microsoft Corporation, used here only to refer to Microsoft Bing.
const icon: PixelIcon = {
  name: "bing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#",
    "..##",
    "..###",
    "..###",
    "..###.##",
    "..###..###",
    "..###...##",
    "..###..###",
    "..#######",
    "..######",
    "...####",
  ],
};

export default icon;
