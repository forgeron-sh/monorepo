import type { PixelIcon } from "../types";

// Arrow pointing up and left: `arrow-up-right-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-left-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..######",
    "..#####",
    "..####",
    "..####",
    "..##.##",
    "..#...##",
    ".......##",
    "........##",
  ],
};

export default icon;
