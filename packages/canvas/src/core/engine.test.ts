import { engineContract } from "./engine-contract";
import { createTsEngine } from "./ts-engine";

engineContract("TypeScript", (setup) => createTsEngine(setup));
