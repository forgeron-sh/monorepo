// Text sizes without a page: an estimate of how many lines a text takes at a width, for the auto
// growing sticky note and the text item. The editor measures the real text when it has a DOM and
// falls back to this (tests, exports, a document opened on a server).

/** The advance of an average character, as a share of the font size (Geist at text sizes). */
const CHAR_ADVANCE = 0.56;
/** Line height as a share of the font size. */
export const LINE_HEIGHT = 1.4;

/** The lines a text wraps into at `width`, by words, breaking a word longer than a line. */
export function wrapLines(text: string, width: number, size: number): string[] {
  const perLine = Math.max(1, Math.floor(width / (size * CHAR_ADVANCE)));
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (w.length > perLine) {
        if (line) {
          out.push(line);
          line = "";
        }
        out.push(w.slice(0, perLine));
        w = w.slice(perLine);
      }
      const next = line ? `${line} ${w}` : w;
      if (next.length > perLine) {
        out.push(line);
        line = w;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

/** The height a text takes at `width`, with `padding` above and below. */
export function textHeight(text: string, width: number, size: number, padding = 0): number {
  const lines = Math.max(1, wrapLines(text, width - padding * 2, size).length);
  return Math.ceil(lines * size * LINE_HEIGHT + padding * 2);
}

/** The width of the longest line of a text that does not wrap. */
export function textWidth(text: string, size: number): number {
  const longest = Math.max(1, ...text.split("\n").map((l) => l.length));
  return Math.ceil(longest * size * CHAR_ADVANCE);
}

/**
 * Under this zoom the board is seen from far: words are too small to read, the DOM shows none and
 * the GPU draws a wash where a text is.
 */
export const FAR_ZOOM = 0.35;

/** World units around the text of a sticky note. */
export const STICKY_PADDING = 12;
/** The font size of a sticky note's text. */
export const STICKY_TEXT = 14;

/** The height of a sticky note: as tall as its text needs, never shorter than it is square. */
export function stickyHeight(text: string, width: number, minHeight = width): number {
  return Math.max(minHeight, textHeight(text, width, STICKY_TEXT, STICKY_PADDING));
}
