import type { PixelIcon } from "../types";

// The Wise mark in pixels: the fast flag, a wide bar across the top whose right end turns into a
// long stroke slanting down to the bottom edge, and on the left a short leg that drops from the
// bar into an arrowhead pointing down-left. Rasterised from the reference `simple-icons:wise`
// (jsDelivr copy of simple-icons, 2026-11-18; Iconify was rate-limited) at cell centres, then
// redrawn by hand: the slant made regular, the one-pixel gap between the arrowhead and the stroke
// kept so the two parts stay apart. Monotone: the mark is a single shape. Wise and the Wise logo
// are trademarks of Wise Payments Limited, used here only to refer to Wise.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wise",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".###########",
    "..##########",
    "...##....##",
    "...##...##",
    "...##...##",
    "..##...##",
    ".#####.##",
    "######.##",
    "......##",
    "......##",
    ".....##",
    ".....##",
  ],
};

export default icon;
