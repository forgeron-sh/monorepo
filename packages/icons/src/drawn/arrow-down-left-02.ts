import type { PixelIcon } from "../types";

// Arrow pointing down and left: `arrow-up-right-02` turned by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-down-left-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "........##",
    ".......##",
    "..#...##",
    "..##.##",
    "..####",
    "..####",
    "..#####",
    "..######",
  ],
};

export default icon;
