import { cx } from "./cx";

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: ReadonlyArray<BarChartDatum>;
  /** Accessible name of the chart. */
  title: string;
  /** Formats the value shown at the end of each bar. */
  format?: (value: number) => string;
  className?: string;
}

/** Horizontal bars in `ink`; every bar carries its label and value as text. */
export function BarChart({ data, title, format = String, className }: BarChartProps) {
  const max = Math.max(0, ...data.map((d) => d.value));
  return (
    <figure className={cx("fg-bars", className)}>
      <figcaption className="fg-bars-title">{title}</figcaption>
      <ul className="fg-bars-list">
        {data.map((d) => (
          <li key={d.label} className="fg-bars-row">
            <span className="fg-bars-label">{d.label}</span>
            <span className="fg-bars-track" aria-hidden="true">
              <span
                className="fg-bars-fill"
                style={{ width: `${max > 0 ? (Math.max(0, d.value) / max) * 100 : 0}%` }}
              />
            </span>
            <span className="fg-bars-value">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
