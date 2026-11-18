import type { PixelIcon } from "../types";

// The Intercom mark, 16×16: a solid rounded square with five vertical bars cut out (the centre
// one two pixels wide, the outer ones shorter) and the smile below them. Rasterised from
// `simple-icons:intercom` (Iconify, 2026-11-17), then redrawn with one-pixel bars and a stepped
// smile. Monotone.
const icon: PixelIcon = {
  name: "intercom",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    ".##############",
    "################",
    "################",
    "################",
    "#####.#..#.#####",
    "##.##.#..#.##.##",
    "##.##.#..#.##.##",
    "##.##.#..#.##.##",
    "##.##.#..#.##.##",
    "#####.#..#.#####",
    "################",
    "##.##########.##",
    "###..######..###",
    "#####......#####",
    "################",
    ".##############",
  ],
};

export default icon;
