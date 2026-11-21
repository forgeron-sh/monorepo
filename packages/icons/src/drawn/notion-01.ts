import type { PixelIcon } from "../types";

// The Notion mark, 16×16: the cube in perspective (a thick left side and top band) with the
// serif N inside. Rasterised from `simple-icons:notion` (Iconify, 2026-11-17), then redrawn: the N
// given a one-pixel left stem, a two-pixel diagonal and serifs, the box edges cleaned. Monotone.
const icon: PixelIcon = {
  name: "notion-01",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "..##########",
    "##..........##",
    "###..........##",
    "################",
    "####...........#",
    "####.###..###..#",
    "####..##...#...#",
    "####..###..#...#",
    "####..#.##.#...#",
    "####..#..###...#",
    "####..#...##...#",
    "####..#....#...#",
    ".###.###...#...#",
    ".###...........#",
    "..##############",
    "...###########",
  ],
};

export default icon;
