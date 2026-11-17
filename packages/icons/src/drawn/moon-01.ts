import type { PixelIcon } from "../types";

// Solid crescent moon: `moon-02` filled in.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###",
    "..###",
    ".####",
    ".####",
    ".####",
    ".#####",
    ".##########",
    ".##########",
    "..########",
    "...######",
  ],
};

export default icon;
