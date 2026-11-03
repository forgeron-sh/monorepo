import type { Manifest } from "@forgeron/manifest";
import { ArchitectureDiagram, EmptyState } from "@forgeron/ui";
import type { FetchJson } from "../../api";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import type { ToolTabProps } from "../tools/tabs";

// The Architecture tab of a tool's page: a diagram drawn from the manifest of the version the
// platform serves (`GET /api/tools/<tool>/manifest`, for developers and admins).

/** What the diagram reads; an answer without it is not a manifest. */
function isManifest(value: unknown): value is Manifest {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  const object = (v: unknown) => typeof v === "object" && v !== null;
  return (
    typeof m.name === "string" &&
    ["interfaces", "roles", "actions", "views", "jobs", "events", "resources", "uses"].every((k) =>
      object(m[k]),
    )
  );
}

export async function loadManifest(fetchJson: FetchJson, tool: string): Promise<Manifest> {
  const body = (await fetchJson(`/api/tools/${tool}/manifest`)) as { manifest?: unknown };
  if (!isManifest(body.manifest)) throw new Error("The platform answered without a manifest.");
  return body.manifest;
}

export default function ArchitectureTab({ tool, api }: ToolTabProps) {
  const manifest = useLoad(() => loadManifest(api.fetchJson, tool), [api, tool]);
  if (manifest.loading) return <Loading label="Loading the architecture" />;
  if (manifest.error && !manifest.data) {
    return <LoadError what="The architecture" error={manifest.error} onRetry={manifest.reload} />;
  }
  if (!manifest.data) {
    return (
      <EmptyState
        title="No version yet"
        description="Deploy the tool: its architecture is drawn from the manifest of its first version."
      />
    );
  }
  return <ArchitectureDiagram manifest={manifest.data} />;
}
