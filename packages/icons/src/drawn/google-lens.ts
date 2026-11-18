import type { PixelIcon } from "../types";

// The Google Lens mark in pixels: the viewfinder frame of three rounded corner brackets
// (top left, top right, bottom left), the bottom right corner left open for the small dot, and
// the large disc in the centre. Rasterised from the reference `simple-icons:googlelens`
// (jsDelivr copy of the Iconify set, 2026-11-18) at cell centres, then redrawn by hand: the
// brackets two pixels thick with a two-pixel gap between arms, the disc a rounded 4 × 4, the dot
// a 2 × 2. Monotone, like the simple-icons version. Google Lens and the Google Lens logo are
// trademarks of Google LLC, used here only to refer to Google Lens.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-lens",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".####..####",
    "#####..#####",
    "##........##",
    "##........##",
    "##...##...##",
    "....####",
    "....####",
    "##...##",
    "##",
    "##.......##",
    "#####....##",
    ".####",
  ],
};

export default icon;
