import type { PixelIcon } from "../types";

// The Confluence mark, 16×16: two swooshes symmetric by a half turn, each thin at its pointed
// tip and thick at its other end, curving round a diagonal gap. Rasterised from
// `simple-icons:confluence` (Iconify, 2026-11-17), then redrawn: the bands tilted and tapered by
// hand (a straight raster read as two cups facing each other). Monotone.
const icon: PixelIcon = {
  name: "confluence",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "#",
    ".#",
    "..##..........##",
    "...###.......###",
    "....############",
    ".....###########",
    ".......#######",
    "",
    "",
    "..#######",
    "###########",
    "############",
    "###.......###",
    "##..........##",
    "..............#",
    "...............#",
  ],
};

export default icon;
