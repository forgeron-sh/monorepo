import type { PixelIcon } from "../types";

// Add a person: a small round head, shoulders, a plus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-add-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##...o",
    "...#..#.ooo",
    "...#..#..o",
    "....##",
    "",
    "..######",
    ".#......#",
    ".#......#",
    ".#......#",
    ".########",
  ],
};

export default icon;
