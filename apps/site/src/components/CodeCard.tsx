interface CodeCardProps {
  title: string;
  /** Texte à droite de l'en-tête (langage, contexte). */
  meta?: string;
  lines: string[];
}

/** Bloc de code numéroté. Les imports et commentaires sont atténués. */
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
