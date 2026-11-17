import type { PixelIcon } from "../types";

// The Anthropic mark, 16×16: the A with its small triangular counter and a flat crossbar, and the
// slanted bar beside it. Rasterised from `simple-icons:anthropic` (Iconify, 2026-11-17), then
// redrawn: strokes evened to three pixels, the counter kept at one to two pixels, the bar
// stepping one column every three rows. Monotone.
const icon: PixelIcon = {
  name: "anthropic",
  implemented: true,
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    "....###..###",
    "....####.###",
    "...#####..###",
    "...#####..###",
    "...##.###.###",
    "..###.###..###",
    "..###..###.###",
    ".#########.###",
    ".#########..###",
    ".###....###.###",
    "###.....###.###",
    "###.....###..###",
  ],
};

export default icon;
