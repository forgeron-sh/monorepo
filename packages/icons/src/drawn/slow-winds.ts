import type { PixelIcon } from "../types";

// Slow wind: three gentle wavy lines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "slow-winds",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..####..#",
    "",
    "",
    "..##....##",
    ".#..####..#",
    "",
    "",
    "..##....##",
    ".#..####..#",
  ],
};

export default icon;
