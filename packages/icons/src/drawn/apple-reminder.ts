import type { PixelIcon } from "../types";

// A reminders list: three dots and lines inside a rounded square.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "apple-reminder",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "#.#.######.#",
    "#..........#",
    "#..........#",
    "#.#.######.#",
    "#..........#",
    "#..........#",
    "#.#.######.#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
