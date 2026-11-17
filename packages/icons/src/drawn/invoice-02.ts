import type { PixelIcon } from "../types";

// Invoice page with a header, two lines and a highlighted total.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "invoice-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.###..#",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#..ooo.#",
    "..########",
  ],
};

export default icon;
