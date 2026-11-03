/** The SharePoint list of the example (docs/examples/03-data-hub.md), read through Microsoft Graph. */
const EQUIPMENTS_URL =
  "https://graph.microsoft.com/v1.0/sites/acme.sharepoint.com:/sites/fleet:/lists/Equipments/items?expand=fields";

export interface ListItem {
  id: string;
  fields: { Ref?: string; NextCheck?: string | null };
}

interface Page {
  value: ListItem[];
  "@odata.nextLink"?: string;
}

type Get = (
  url: string,
  init: { headers: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

/** Reads every page of the list. */
export async function readList(get: Get, token: string): Promise<ListItem[]> {
  const items: ListItem[] = [];
  let url: string | undefined = EQUIPMENTS_URL;
  while (url) {
    const response = await get(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`SharePoint answered ${response.status}.`);
    const page = (await response.json()) as Page;
    items.push(...page.value);
    url = page["@odata.nextLink"];
  }
  return items;
}
