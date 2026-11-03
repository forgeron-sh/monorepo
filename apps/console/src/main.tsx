import "@forgeron/ui/styles.css";
import "./console.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { fetchJson, sendJson } from "./api";

// The console of a workspace. `VITE_MOCK=1 vite` (the `console-harness` preview) swaps the gateway for
// an in-memory one so every screen can be seen without a workspace; a build never contains it.
async function start() {
  if (import.meta.env.VITE_MOCK) await (await import("./mock/install")).installMock();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App api={{ fetchJson, sendJson }} />
    </StrictMode>,
  );
}
void start();
