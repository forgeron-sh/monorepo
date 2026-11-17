import type { PixelIcon } from "../types";

// A barbell: a long bar through two heavy plates, one on each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "equipment-weightlifting",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##....##",
    ".###....###",
    ".###....###",
    "############",
    "############",
    ".###....###",
    ".###....###",
    "..##....##",
  ],
};

export default icon;
