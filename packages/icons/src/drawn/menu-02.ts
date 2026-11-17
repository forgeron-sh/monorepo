import type { PixelIcon } from "../types";

// Menu: three bars, the last one shorter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "menu-02",
  implemented: true,
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
    "..########",
    "",
    "",
    "..#####",
  ],
};

export default icon;
