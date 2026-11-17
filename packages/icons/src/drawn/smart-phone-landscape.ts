import type { PixelIcon } from "../types";

// A smartphone turned on its side; `smart-phone-01` rotated.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "smart-phone-landscape",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    ".#........#",
    ".#......o.#",
    ".#......o.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
