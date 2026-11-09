// SDK entry point. The public API is specified in docs/sdk.md.

/** Standard access levels of an action (docs/sdk.md, section 1). */
export const ACCESS_LEVELS = ["read", "write", "delete", "admin"] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export { z } from "zod";
export { ToolError, TOOL_ERROR_CODES, type ToolErrorCode } from "./errors";
export { action } from "./action";
export type { Access, ActionDefinition, ActionOptions, RateLimit } from "./action";
export { on, schedule } from "./events";
export type {
  EventContext,
  EventDefinition,
  EventMode,
  EventOptions,
  JobDefinition,
  ScheduleOptions,
} from "./events";
export { bucket, connector, database, defineConfig, field, kv, queue } from "./config";
export type { PlainField, SecretField, ToolConfig, ToolSetup } from "./config";
export {
  checkConnectorDeclaration,
  connectorHosts,
  createConnectorClient,
  defineConnector,
} from "./connectors";
export type {
  ConnectorClient,
  ConnectorDeclaration,
  ConnectorDefinition,
  ConnectorMode,
  ConnectorSession,
} from "./connectors";
export type {
  Cache,
  ContextConnectors,
  ContextDb,
  CacheOptions,
  CallSource,
  Context,
  ContextUser,
  Environment,
  Fetch,
  FetchInit,
  FetchResponse,
  Files,
  Logger,
  Register,
  ToolClient,
  User,
} from "./context";
