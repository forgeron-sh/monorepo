// The public surface of the identity-store module: the only file another part of the registry may import.
export { createIdentityStore } from "./store";
export { identityStoreMigrations } from "./migrations";
