import type { PixelIcon } from "../types";

// Fast forward: two solid triangles pointing right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "forward-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#....#",
    "..##...##",
    "..###..###",
    "..####.####",
    "..####.####",
    "..###..###",
    "..##...##",
    "..#....#",
  ],
};

export default icon;
