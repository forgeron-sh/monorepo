import type { PixelIcon } from "../types";

// Bold plus: two-pixel bars eight pixels long, centred exactly (`plus-sign` is the one-pixel plus).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "add-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    ".....##",
    ".....##",
    "..########",
    "..########",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
