import type { PixelIcon } from "../types";

// The OpenAI mark, 16×16: the six interlaced links of the blossom round a hexagonal hole.
// Rasterised from `simple-icons:openai` (Iconify, 2026-11-17), then redrawn: the links one or two
// pixels wide, closed where sampling broke them, the hole kept open. Monotone.
const icon: PixelIcon = {
  name: "openai",
  implemented: true,
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    ".....####",
    "....##..####",
    "...##...##.###",
    "..##..###....##",
    ".###.##..###..#",
    "##.#.###...##.#",
    "#..#.#.##.#..##",
    "##.#.#...##...##",
    "##..###...#.#..#",
    ".##..##..##.#..#",
    ".####..##.#.#.##",
    ".#..###..##.#.#",
    ".##.....##..###",
    "..##.####..##",
    "...####...##",
    ".......####",
  ],
};

export default icon;
