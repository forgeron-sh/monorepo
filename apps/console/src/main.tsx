import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The shell of the console. The pages (tools, access, secrets) come with their own tickets.
function App() {
  return (
    <main>
      <h1>Forgeron console</h1>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
