import type { PixelIcon } from "../types";

// Chevron pointing down, 12×12: two-pixel diagonals, one tone (a tip in the secondary tone marked
// no idea and read as a stray pixel). One row lower than the centre: its weight is at the top.
// Proportions after Hugeicons `arrow-down-01` (Iconify preview, 2026-11-16), redrawn as pixel art, not traced.
const icon: PixelIcon = {
  name: "arrow-down-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "............",
    "............",
    "............",
    "............",
    "..#......#..",
    "..##....##..",
    "...##..##...",
    "....####....",
    ".....##.....",
    "............",
    "............",
    "............",
  ],
};

export default icon;
