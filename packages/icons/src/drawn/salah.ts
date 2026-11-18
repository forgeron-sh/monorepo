import type { PixelIcon } from "../types";

// Salah: a person standing in prayer with the arms folded on the chest, on a prayer mat, the head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "salah",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    "",
    "...######",
    "...######",
    "...######",
    "....####",
    "....#..#",
    "....#..#",
    "",
    "..########",
  ],
};

export default icon;
