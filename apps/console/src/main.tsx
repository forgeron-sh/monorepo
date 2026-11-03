import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AccessMatrixEditor } from "./access-matrix";
import { fetchJson, sendJson } from "./api";
import { loadTools, type ToolRow } from "./tools-list";

// The shell of the console. For now: the access matrix of each tool of the workspace; the other
// pages (tools, secrets) come with their own tickets.
function App() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  useEffect(() => {
    loadTools(fetchJson).then(setTools, () => setTools([]));
  }, []);
  return (
    <main>
      <h1>Forgeron console</h1>
      {tools.map((tool) => (
        <section key={tool.name}>
          <h2>{tool.name}: who may call what</h2>
          <AccessMatrixEditor tool={tool.name} fetchJson={fetchJson} sendJson={sendJson} />
        </section>
      ))}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
