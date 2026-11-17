import type { PixelIcon } from "../types";

// Sun: a small solid disc (a ring read as dots at 16 px), four two-by-two rays and four 45° rays, symmetric, centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the four corner rays.
const icon: PixelIcon = {
  name: "sun-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o...##...o",
    "..o..##..o",
    "",
    ".....##",
    ".##.####.##",
    ".##.####.##",
    ".....##",
    "",
    "..o..##..o",
    ".o...##...o",
  ],
};

export default icon;
