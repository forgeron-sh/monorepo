import type { PixelIcon } from "../types";

// The Blogger mark in pixels: a rounded square with the “B” cut out of it, its two bars kept solid.
// 12×12: `#` primary tone. Rasterised from `simple-icons:blogger` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// Blogger and the Blogger logo are trademarks of Google LLC, used here only to refer to Blogger.
const icon: PixelIcon = {
  name: "blogger",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "###....#####",
    "##......####",
    "##..###..###",
    "##........##",
    "##........##",
    "##..####..##",
    "##........##",
    "###......###",
    "############",
    ".##########",
  ],
};

export default icon;
