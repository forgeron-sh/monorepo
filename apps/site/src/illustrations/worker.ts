/**
 * The worker that plays the site's iso scenes (`canvas.ts` starts it): one engine for every
 * canvas of the page, each canvas handed over as an OffscreenCanvas. The engine starts at once;
 * the scenes (their functions and compiled files) load beside it.
 */
import { serveBlueprint } from "@forgeron/blueprint/dom";

serveBlueprint(import("./sources").then((m) => m.sourceOf));
