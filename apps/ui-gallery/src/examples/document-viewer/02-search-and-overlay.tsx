import { DocumentViewer } from "@forgeron/ui";

const page = (n: number) => ({
  id: `p${n}`,
  width: 600,
  height: 800,
  alt: `Page ${n} of the agreement`,
  src: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#fff"/><text x="48" y="80" font-family="monospace" font-size="22" fill="#222">Service agreement - page ${n}</text>${Array.from({ length: 14 }, (_, i) => `<rect x="48" y="${130 + i * 28}" width="${i % 5 === 4 ? 300 : 504}" height="8" fill="#ccc"/>`).join("")}</svg>`,
  )}`,
});
const pages = [1, 2, 3].map(page);

export default function SearchAndOverlay() {
  return (
    <div style={{ width: "100%" }}>
      <DocumentViewer
        label="Service agreement"
        pages={pages}
        height={460}
        thumbnails={false}
        onSearch={async (query) =>
          query.toLowerCase().includes("page") ? [{ page: 1 }, { page: 3 }] : []
        }
        overlay={({ number, width }) =>
          number === 1 ? (
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                padding: "2px 6px",
                background: "var(--accent)",
                color: "var(--accent-ink)",
                font: "500 11px/16px var(--font-mono)",
                textTransform: "uppercase",
              }}
              title={`${width}px wide`}
            >
              Draft
            </span>
          ) : null
        }
      />
    </div>
  );
}
