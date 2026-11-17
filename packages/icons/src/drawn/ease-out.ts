import type { PixelIcon } from "../types";

// Ease-out curve: steep at the start, flattening to the end, with a handle dot at each end in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ease-out",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........oo",
    ".......##oo",
    ".....##",
    "....#",
    "...#",
    "..#",
    ".#",
    ".#",
    "oo",
    "oo",
  ],
};

export default icon;
