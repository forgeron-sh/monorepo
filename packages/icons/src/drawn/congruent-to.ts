import type { PixelIcon } from "../types";

// Congruence sign: a tilde over two bars.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "congruent-to",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....##..#",
    "...#..##",
    "",
    "",
    "..########",
    "",
    "",
    "..########",
  ],
};

export default icon;
