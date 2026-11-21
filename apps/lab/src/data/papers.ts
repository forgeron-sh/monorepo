import type { Area } from "./projects";

/**
 * A paper of the lab: a document of the repository's `docs/`, published as is. The text stays in
 * `docs/` (one source); this is its card: the permanent number, the kind, the date and the
 * projects it belongs to.
 */
export interface Paper {
  /** The permanent number: `R-001`. Never reused. */
  id: string;
  /** Its path under `docs/`, without `.md`: also the content collection's id. */
  doc: string;
  slug: string;
  title: string;
  /** `Benchmark`: a measured answer. `Design`: how a system is built and why. `Spec`: normative. `Method`: how we work. */
  kind: "Benchmark" | "Design" | "Spec" | "Method";
  /** First written, ISO date. */
  date: string;
  area: Area;
  /** Slugs of the projects it belongs to. */
  projects: readonly string[];
  /** One line: the question it answers. */
  line: string;
}

export const PAPERS: readonly Paper[] = [
  {
    id: "R-001",
    doc: "icons",
    slug: "drawing-a-pixel-icon",
    title: "Drawing a pixel icon",
    kind: "Method",
    date: "2026-11-16",
    area: "Design system",
    projects: ["icons"],
    line: "What makes a 12-pixel icon read at 16, 24 and 48 px.",
  },
  {
    id: "R-002",
    doc: "benchmarks/canvas-engine",
    slug: "canvas-engine-typescript-or-rust",
    title: "Canvas engine: TypeScript or Rust?",
    kind: "Benchmark",
    date: "2026-11-18",
    area: "Editors",
    projects: ["canvas", "draw", "flow"],
    line: "Does the editors' core need WebAssembly to hold 20,000 items at 60 fps?",
  },
  {
    id: "R-003",
    doc: "blueprint/engine",
    slug: "blueprint-engine",
    title: "Blueprint: a scene engine with a Rust core",
    kind: "Design",
    date: "2026-11-18",
    area: "Graphics",
    projects: ["blueprint"],
    line: "Iso scenes as data, compiled and rasterised the same in the browser and at build.",
  },
  {
    id: "R-004",
    doc: "blueprint/format",
    slug: "blueprint-format-v1",
    title: "Blueprint file format, version 1",
    kind: "Spec",
    date: "2026-11-18",
    area: "Graphics",
    projects: ["blueprint"],
    line: "Parts, assemblies and scenes in one JSON document.",
  },
  {
    id: "R-005",
    doc: "shaders/design",
    slug: "shaders-one-pipeline-of-passes",
    title: "Shaders: one pipeline of passes",
    kind: "Design",
    date: "2026-11-19",
    area: "Graphics",
    projects: ["shaders"],
    line: "Every pixel effect as a source, a chain of passes and an output.",
  },
];

/** Newest first. */
export const PAPERS_BY_DATE: readonly Paper[] = [...PAPERS].sort(
  (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
);

export function papersOf(project: string): Paper[] {
  return PAPERS_BY_DATE.filter((p) => p.projects.includes(project));
}
