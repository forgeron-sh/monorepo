import type { PixelIcon } from "../types";

// A smartphone turned on its side; `smart-phone-02` rotated, the notch in the secondary tone on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "smart-phone-landscape-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..########",
    ".#........#",
    ".#o.......#",
    ".#o.......#",
    ".#........#",
    "..########",
  ],
};

export default icon;
