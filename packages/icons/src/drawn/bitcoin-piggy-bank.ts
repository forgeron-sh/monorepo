import type { PixelIcon } from "../types";

// The piggy bank of `piggy-bank` (ear, snout, tail and legs), its body widened to carry the
// bitcoin sign of `coins-bitcoin` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-piggy-bank",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##",
    "..########",
    ".#........#",
    "##..ooo...#",
    "##..o..o..#",
    ".#..ooo...##",
    ".#..o..o..#",
    "..#.ooo..#",
    "...######",
    "...#....#",
  ],
};

export default icon;
