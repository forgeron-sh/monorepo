// The Versions tab restores an older version as a new one; the Activity tab takes any timeline.
import { AuditLog, FileDetails, type FileVersion } from "@forgeron/ui";
import { useState } from "react";

export default function VersionsAndActivity() {
  const [versions, setVersions] = useState<FileVersion[]>([
    {
      id: "v3",
      label: "v3",
      at: "Nov 18, 2026 · 09:12",
      by: "Léa Martin",
      size: 240_000,
      note: "Dock 3 lane",
    },
    { id: "v2", label: "v2", at: "Nov 9, 2026 · 17:30", by: "Tom Garnier", size: 236_000 },
    {
      id: "v1",
      label: "v1",
      at: "Oct 3, 2026 · 10:40",
      by: "Léa Martin",
      size: 198_000,
      note: "Uploaded",
    },
  ]);
  const restore = (id: string) => {
    const old = versions.find((v) => v.id === id)!;
    const n = versions.length + 1;
    setVersions([
      {
        id: `v${n}`,
        label: `v${n}`,
        at: "Nov 18, 2026 · 11:02",
        by: "Camille Roy",
        size: old.size,
        note: `Restored from ${old.label}`,
      },
      ...versions,
    ]);
  };
  return (
    <div style={{ width: 360 }}>
      <FileDetails
        name="Dock plan.pdf"
        size={versions[0]!.size}
        defaultTab="versions"
        versions={versions}
        retention="Old versions are kept 30 days after a replace."
        onRestoreVersion={restore}
        onDownloadVersion={() => {}}
        onUploadVersion={() => {}}
        onClose={() => {}}
        activity={
          <AuditLog
            today="2026-11-18"
            events={[
              {
                id: "e2",
                at: "2026-11-18 09:12",
                actor: "Léa Martin",
                action: "uploaded",
                target: "v3",
              },
              {
                id: "e1",
                at: "2026-11-09 17:30",
                actor: "Tom Garnier",
                action: "shared with",
                target: "Operations",
              },
            ]}
          />
        }
      />
    </div>
  );
}
