// The parts of the gallery: put the search above the categories, the grid and the pane where you want.
import {
  TemplateGallery,
  TemplateGalleryBar,
  TemplateGalleryCategories,
  TemplateGalleryEmpty,
  TemplateGalleryGrid,
  TemplateGalleryMain,
  TemplateGalleryPane,
  TemplateGallerySearch,
  type TemplateItem,
} from "@forgeron/ui";
import { useState } from "react";

const templates: TemplateItem[] = [
  { id: "meeting", name: "Meeting notes", category: "Team", description: "Agenda and decisions." },
  { id: "retro", name: "Retrospective", category: "Team", badge: "New" },
  { id: "roadmap", name: "Roadmap", category: "Product", description: "Quarter by quarter." },
  { id: "spec", name: "Product spec", category: "Product" },
];

export default function Default() {
  const [log, setLog] = useState("Pick one, press Enter or double click");
  return (
    <div style={{ display: "grid", gap: 8, width: "100%" }}>
      <TemplateGallery
        templates={templates}
        onChoose={(id) => setLog(id === null ? "Started from blank" : `Started from ${id}`)}
      >
        <TemplateGalleryMain>
          <TemplateGalleryBar>
            <TemplateGallerySearch placeholder="Find a template" />
            <TemplateGalleryCategories />
          </TemplateGalleryBar>
          <TemplateGalleryGrid />
          <TemplateGalleryEmpty />
        </TemplateGalleryMain>
        <TemplateGalleryPane />
      </TemplateGallery>
      <span style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}>{log}</span>
    </div>
  );
}
