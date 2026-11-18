import type { PixelIcon } from "../types";

// Fence: three pickets held by two rails, solid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fence",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".##..##..##",
    "############",
    ".##..##..##",
    ".##..##..##",
    ".##..##..##",
    "############",
    ".##..##..##",
    ".##..##..##",
    ".##..##..##",
  ],
};

export default icon;
