import type { PixelIcon } from "../types";

// A person wearing a peaked cap.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "prison-guard",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "...oooooo",
    "....#..#",
    "....#..#",
    ".....##",
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
