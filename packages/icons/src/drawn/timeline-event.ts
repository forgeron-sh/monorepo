import type { PixelIcon } from "../types";

// Timeline event: a card with two lines of text above a point, in the secondary tone, on a timeline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "timeline-event",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#........#",
    ".#.###....#",
    ".#........#",
    ".#.######.#",
    ".#........#",
    ".##########",
    "",
    ".....oo",
    "....o..o",
    "###.o..o.###",
    ".....oo",
  ],
};

export default icon;
