interface CodeCardProps {
  title: string;
  /** Text on the right of the header (language, context). */
  meta?: string;
  lines: string[];
}

/** Numbered code block. Imports and comments are muted. */
export function CodeCard({ title, meta, lines }: CodeCardProps) {
  return (
    <div className="card sunken">
      <div className="card-head text-code">
        <span>{title}</span>
        {meta ? <span>{meta}</span> : null}
      </div>
      <pre className="code text-code">
        {lines.map((line, i) => (
          <span
            key={i}
            className={/^(import|\s*\/\/)/.test(line) ? "line muted" : "line"}
            data-n={i + 1}
          >
            {line === "" ? " " : line}
          </span>
        ))}
      </pre>
    </div>
  );
}
