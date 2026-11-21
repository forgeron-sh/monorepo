import type { PixelIcon } from "../types";

// Binary: 1 0 over 0 1, the zeros in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "binary-code",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#...ooo",
    "..##...o.o",
    "...#...o.o",
    "..###..ooo",
    "",
    "",
    "..ooo...#",
    "..o.o..##",
    "..o.o...#",
    "..ooo..###",
  ],
};

export default icon;
