import type { PixelIcon } from "../types";

// Quiz flashcards: two stacked cards, a question mark on the front one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "quiz-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    "########..#",
    "#..oo..#..#",
    "#.o..o.#..#",
    "#...o..#..#",
    "#...o..#..#",
    "#......####",
    "#...o..#",
    "########",
  ],
};

export default icon;
