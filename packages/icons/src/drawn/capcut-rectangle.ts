import type { PixelIcon } from "../types";

// The CapCut mark cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `thesvg:capcut` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// CapCut and the CapCut logo are trademarks of ByteDance Ltd., used here only to refer to CapCut.
const icon: PixelIcon = {
  name: "capcut-rectangle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "##......#.##",
    "##..##...###",
    "####...#####",
    "####...#####",
    "##..##...###",
    "##......#.##",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
