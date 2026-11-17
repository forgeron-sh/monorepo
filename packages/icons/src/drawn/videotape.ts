import type { PixelIcon } from "../types";

// Videotape: a cassette with two reels joined by the tape, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "videotape",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "############",
    "#..........#",
    "#..oo..oo..#",
    "#.o..oo..o.#",
    "#..oo..oo..#",
    "#..........#",
    "############",
  ],
};

export default icon;
