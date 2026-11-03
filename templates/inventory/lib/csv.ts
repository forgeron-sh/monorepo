/** Parses CSV text (RFC 4180: quoted fields, doubled quotes, CRLF) into rows keyed by the header line. */
export function parseCsv(text: string): Array<Record<string, string>> {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;

  const endField = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    // A blank line is not a record.
    if (record.length > 1 || record[0] !== "") records.push(record);
    record = [];
  };

  const source = text.replace(/^﻿/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;
    if (quoted) {
      if (char !== '"') field += char;
      else if (source[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") endField();
    else if (char === "\n") endRecord();
    else if (char !== "\r") field += char;
  }
  if (field !== "" || record.length > 0) endRecord();

  const [header, ...rows] = records;
  if (!header) return [];
  const names = header.map((name) => name.trim().toLowerCase());
  return rows.map((row) =>
    Object.fromEntries(names.map((name, i) => [name, (row[i] ?? "").trim()])),
  );
}
