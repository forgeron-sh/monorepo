import type { PixelIcon } from "../types";

// The Attio mark, 16×16: a long rounded bar slanted at 2:1 and a small rounded rhombus on its
// lower right. Rasterised from `thesvg-color:attio` (Iconify, theSVG collection, MIT, 2026-11-17;
// simple-icons and logos have no Attio), then redrawn as solid shapes: the reference's outlines
// were noise at 16 and 24 px. Monotone.
const icon: PixelIcon = {
  name: "attio",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    ".........##",
    "........####",
    ".......####",
    ".......####",
    "......####",
    "......####",
    ".....####",
    ".....####...##",
    "....####...####",
    "....####..#####",
    "...####...####",
    "....##.....##",
  ],
};

export default icon;
