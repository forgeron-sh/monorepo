/**
 * THE LICENCE OF FORGERON SANS: the single source of the licence section, of `/OFL.txt` and of the
 * licence file inside the download archive. Change it here and nowhere else.
 *
 * - The licence text (`ofl-1.1.txt`) is the official SIL Open Font License 1.1, downloaded from
 *   https://openfontlicense.org/documents/OFL.txt on 2026-11-16, from its first separator line on
 *   (the template header above it is replaced by `copyrightNotice`).
 * - `holder` is the owner's decision (2026-11-16): "forgeron.sh", written exactly so.
 * - No Reserved Font Name is declared (undecided). To declare one, add `reservedFontName`.
 */

export interface FontLicence {
  readonly name: string;
  readonly spdx: string;
  readonly url: string;
  /** Who holds the copyright. */
  readonly holder: string;
  /** Years of the copyright notice. 2026 is the creation date written in the font files' `head`. */
  readonly years: string;
  /** A Reserved Font Name, or `null` for none. */
  readonly reservedFontName: string | null;
}

export const FONT_LICENCE: FontLicence = {
  name: "SIL Open Font License 1.1",
  spdx: "OFL-1.1",
  url: "https://openfontlicense.org",
  holder: "forgeron.sh",
  years: "2026",
  reservedFontName: null,
};

/** The copyright line that heads the licence file: `Copyright (c) 2026 forgeron.sh`. */
export function copyrightNotice(licence: FontLicence): string {
  const rfn = licence.reservedFontName
    ? `,\nwith Reserved Font Name ${licence.reservedFontName}.`
    : "";
  return `Copyright (c) ${licence.years} ${licence.holder}${rfn}`;
}

/** The full licence file: notice, the OFL's standard header lines, then the licence text. */
export function licenceFile(licence: FontLicence, text: string): string {
  return [
    copyrightNotice(licence),
    "",
    "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
    "This license is copied below, and is also available with a FAQ at:",
    "https://openfontlicense.org",
    "",
    "",
    text.trimEnd(),
    "",
  ].join("\n");
}
