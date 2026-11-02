// An action has one name, from which every interface derives its address (sdk.md §2, §7).
//
//   actions/deals/move.ts  ->  deals.move
//   MCP  <tool>_<group>_<verb>        crm_deals_move
//   API  /t/<tool>/api/<action>       /t/crm/api/deals.move
//   CLI  forgeron <tool> <group> <verb>   forgeron crm deals move

/** `deals/move.ts` is `deals.move`: the path under `actions/`, with dots, two levels at most. */
export function actionNameOfPath(relativePath: string): string {
  const parts = relativePath.split(/[\\/]/).filter(Boolean);
  if (parts.length === 0) throw new Error("An action needs a file name.");
  parts[parts.length - 1] = parts[parts.length - 1]!.replace(/\.[^.]+$/, "");
  if (parts.length > 2) {
    throw new Error(`${relativePath}: an action is at most two levels deep (group.verb).`);
  }
  return parts.join(".");
}

export interface ActionAddresses {
  /** `deals.move` */
  name: string;
  /** `crm_deals_move` */
  mcp: string;
  /** `/t/crm/api/deals.move` */
  api: string;
  /** `forgeron crm deals move` */
  cli: string;
}

export function actionAddresses(tool: string, action: string): ActionAddresses {
  return {
    name: action,
    mcp: `${tool}_${action.replaceAll(".", "_")}`,
    api: `/t/${tool}/api/${action}`,
    cli: `forgeron ${tool} ${action.replaceAll(".", " ")}`,
  };
}

/** `checkBefore` is `--check-before`: the other input fields of an action are CLI options. */
export function optionFlag(field: string): string {
  return `--${field.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}
