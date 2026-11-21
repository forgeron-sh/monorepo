import type { PixelIcon } from "../types";

// The Bootstrap mark in pixels: the “B” cut out of a rounded square.
// 12×12: `#` primary tone. Rasterised from `simple-icons:bootstrap` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Bootstrap and the Bootstrap logo are trademarks of the Bootstrap project, used here only to refer to Bootstrap.
const icon: PixelIcon = {
  name: "bootstrap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "###....#####",
    "###.###.####",
    "###.###.####",
    "###....#####",
    "###.###.####",
    "###.###.####",
    "###....#####",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
