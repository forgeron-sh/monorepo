import type { PixelIcon } from "../types";

// A cash slot with a note coming out of it, a bitcoin sign on the note in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-withdraw",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "#..........#",
    "#.########.#",
    "..#......#",
    "..#.ooo..#",
    "..#.o..o.#",
    "..#.ooo..#",
    "..#.o..o.#",
    "..#.ooo..#",
    "..#......#",
    "..########",
  ],
};

export default icon;
