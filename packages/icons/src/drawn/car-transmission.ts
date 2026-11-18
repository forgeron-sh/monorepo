import type { PixelIcon } from "../types";

// Car transmission: the H pattern of a gear lever, the knob positions in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "car-transmission",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".ooo.ooo.ooo",
    "..#...#...#",
    "..#...#...#",
    "..#########",
    "..#...#...#",
    "..#...#...#",
    ".ooo.ooo.ooo",
  ],
};

export default icon;
