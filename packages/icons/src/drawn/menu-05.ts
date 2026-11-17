import type { PixelIcon } from "../types";

// Menu: four bars, eight pixels long, two-pixel gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "menu-05",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "",
    "",
    "..########",
    "",
    "",
    "..########",
    "",
    "",
    "..########",
  ],
};

export default icon;
