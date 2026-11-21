import type { PixelIcon } from "../types";

// Key lying flat: a round bow, a two-row shank, the bit at the end; centred both ways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "key-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..####",
    ".#....#",
    ".#....#####",
    ".#....#####",
    ".#....#..##",
    "..####...##",
  ],
};

export default icon;
