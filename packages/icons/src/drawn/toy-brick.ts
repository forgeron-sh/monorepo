import type { PixelIcon } from "../types";

// Toy brick: a block with two studs on top in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "toy-brick",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..ooo..ooo",
    "..ooo..ooo",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
