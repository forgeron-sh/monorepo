import type { PixelIcon } from "../types";

// Energy: a solid lightning bolt, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "energy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......##",
    ".....##",
    "....##",
    "...##",
    "..########",
    "..########",
    ".......##",
    "......##",
    ".....##",
    "....##",
  ],
};

export default icon;
