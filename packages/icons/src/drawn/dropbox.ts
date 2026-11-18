import type { PixelIcon } from "../types";

// The Dropbox mark in pixels: five rhombi, two pairs side by side stacked one above the other and
// a fifth one centred below, the open box; its top tip sits between the lower pair. Rasterised from the geometry of `simple-icons:dropbox` (Iconify fetch rate-limited on 2026-11-18)
// at cell centres, then redrawn by hand: each rhombus three rows tall, the pairs separated by a
// two-pixel gap and the layers by one empty row so the five parts stay apart. Monotone: the mark
// has no second tone. Dropbox and the Dropbox logo are trademarks of Dropbox, Inc., used here only
// to refer to Dropbox.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "dropbox",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    "#####..#####",
    ".###....###",
    "",
    ".###....###",
    "#####..#####",
    ".###.##.###",
    "....####",
    ".....##",
  ],
};

export default icon;
