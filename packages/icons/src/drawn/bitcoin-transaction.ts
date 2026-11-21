import type { PixelIcon } from "../types";

// Two arrows turning around a bitcoin sign, symmetric by a half turn, the sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-transaction",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..o",
    ".#..ooo",
    "###.o..o..#",
    ".#..ooo..###",
    "....o..o..#",
    "....ooo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
