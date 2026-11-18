import type { PixelIcon } from "../types";

// Menu: three bars getting shorter from the top, aligned left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "menu-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..########",
    "",
    "",
    "..######",
    "",
    "",
    "..####",
  ],
};

export default icon;
