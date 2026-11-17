import type { PixelIcon } from "../types";

// Charging battery: the outline of `battery-full` and a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-charging-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#########",
    ".#....o..#",
    ".#...oo..##",
    ".#..oo...##",
    ".#..o....#",
    ".#########",
  ],
};

export default icon;
