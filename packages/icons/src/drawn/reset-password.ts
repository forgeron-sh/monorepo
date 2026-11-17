import type { PixelIcon } from "../types";

// Reset password: a password field of dots, its corner cut by a circular arrow badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "reset-password",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "#..........#",
    "#.##.##.##.#",
    "#.##.##.##.#",
    "#..........#",
    "#######",
    "........ooo",
    ".......o...o",
    "......ooo..o",
    "...........o",
    "........ooo",
  ],
};

export default icon;
