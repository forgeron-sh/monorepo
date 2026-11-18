import type { PixelIcon } from "../types";

// The CapCut mark in pixels: two bars joined by a crossing whose ends poke out on the right.
// 12×12: `#` primary tone. Rasterised from `thesvg:capcut` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// CapCut and the CapCut logo are trademarks of ByteDance Ltd., used here only to refer to CapCut.
const icon: PixelIcon = {
  name: "capcut",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#########..#",
    "############",
    "##......####",
    "####..####",
    "..######",
    "..######",
    "####..####",
    "##......####",
    "############",
    "#########..#",
  ],
};

export default icon;
