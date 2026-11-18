import type { PixelIcon } from "../types";

// The Zendesk mark, 16×16: four quarters, a half disc flat side up on the top left, a right
// triangle on the top right, a triangle on the bottom left, a half disc flat side down on the
// bottom right, split by a vertical gap. Rasterised from `simple-icons:zendesk` (Iconify,
// 2026-11-17), then cleaned. Monotone.
const icon: PixelIcon = {
  name: "zendesk",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    "#######..#######",
    "#######..######",
    ".#####...#####",
    "...##....####",
    "......#..###",
    ".....##..##",
    ".....##..##",
    "....###..#",
    "...####....##",
    "..#####...#####",
    ".######..#######",
    "#######..#######",
  ],
};

export default icon;
