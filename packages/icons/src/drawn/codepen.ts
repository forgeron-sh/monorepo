import type { PixelIcon } from "../types";

// The CodePen mark in pixels, 16×16 (on 12 the cube read as a target): the outline of a cube cut out of a disc.
// 16×16: `#` primary tone. Rasterised from `simple-icons:codepen` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// CodePen and the CodePen logo are trademarks of CodePen, Inc., used here only to refer to CodePen.
const icon: PixelIcon = {
  name: "codepen",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    ".....######",
    "...##########",
    "..############",
    ".######..######",
    ".#####....#####",
    "####..####..####",
    "###.###..###.###",
    "###....##....###",
    "###....##....###",
    "###.###..###.###",
    "####..####..####",
    ".#####....#####",
    ".######..######",
    "..############",
    "...##########",
    ".....######",
  ],
};

export default icon;
