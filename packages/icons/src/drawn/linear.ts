import type { PixelIcon } from "../types";

// The Linear mark, 16×16: a disc whose lower-left part is cut by three parallel 45° lines, leaving
// three thin bands under the solid upper-right body. On 12×12 the cuts merge into a dither.
// Rasterised from `simple-icons:linear` (Iconify, 2026-11-17), then redrawn: the disc made round,
// the cuts set one pixel wide at equal spacing. Monotone.
const icon: PixelIcon = {
  name: "linear",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "......####",
    "....########",
    "...##########",
    "..############",
    "..#############",
    ".#.############",
    ".##.############",
    "#.##.###########",
    "##.##.##########",
    ".##.##.#########",
    "..##.##.#######",
    ".#.##.##.######",
    "..#.##.##.####",
    "...#.##.##.##",
    "....#.##.##",
    ".......##",
  ],
};

export default icon;
