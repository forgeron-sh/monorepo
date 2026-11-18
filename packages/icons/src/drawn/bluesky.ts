import type { PixelIcon } from "../types";

// The Bluesky butterfly in pixels: the two large upper wings and the two smaller lower ones.
// 12×12: `#` primary tone. Rasterised from `simple-icons:bluesky` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Bluesky and the Bluesky butterfly logo are trademarks of Bluesky Social, PBC, used here only to refer to Bluesky.
const icon: PixelIcon = {
  name: "bluesky",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "#..........#",
    "##........##",
    "###......###",
    "####....####",
    "#####..#####",
    "############",
    ".##########",
    "...######",
    "..########",
    ".####..####",
    ".###....###",
    "..#......#",
  ],
};

export default icon;
