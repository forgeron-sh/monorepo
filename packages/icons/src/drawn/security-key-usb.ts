import type { PixelIcon } from "../types";

// USB security key: a small plug on a body with a round touch pad in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "security-key-usb",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "..########",
    "..#......#",
    "..#..oo..#",
    "..#.o..o.#",
    "..#.o..o.#",
    "..#..oo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
