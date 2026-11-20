import { glyph, glyphWidth } from "@forgeron/font";

// The rows of a pixel title for the reveal (`mountReveal` of @forgeron/shaders): the face is
// Blueprint's, so it is set here.

/**
 * The rows of `text` in the pixel face's capitals: one string per pixel row (7), `#` for ink,
 * one column between letters.
 */
export function textRows(text: string): string[] {
  const rows = Array.from({ length: 7 }, () => "");
  const caps = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
  [...caps].forEach((ch, i) => {
    const g = glyph(ch);
    const w = glyphWidth(g);
    for (let r = 0; r < 7; r++) {
      const row = g.rows[r - g.top] ?? ".".repeat(w);
      rows[r] += (i > 0 ? "." : "") + row.padEnd(w, ".");
    }
  });
  return rows;
}
