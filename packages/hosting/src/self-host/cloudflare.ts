// A small client of the Cloudflare API, over `fetch` so that the gateway (a Worker) and the CLI can
// both use it, and a test can hand it a simulated account. Every call goes through `request`.

export interface CloudflareOptions {
  accountId: string;
  /** Limited to Workers, D1, KV and R2 (docs/ARCHITECTURE.md, "Installing the platform in self-host"). */
  apiToken: string;
  fetch?: typeof fetch;
  baseUrl?: string;
}

export class CloudflareError extends Error {
  override name = "CloudflareError";
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface Envelope<T> {
  success: boolean;
  errors?: { code?: number; message: string }[];
  result: T;
}

export interface CloudflareClient {
  readonly accountId: string;
  /** `path` is under `/accounts/<id>`. Returns the `result` of the envelope. */
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
  /** Like `request`, with a multipart body: the upload of a Worker. */
  form<T>(method: string, path: string, body: FormData): Promise<T>;
}

export function createCloudflareClient(options: CloudflareOptions): CloudflareClient {
  const doFetch = options.fetch ?? fetch;
  const base = options.baseUrl ?? "https://api.cloudflare.com/client/v4";
  async function send<T>(
    method: string,
    path: string,
    body: string | FormData | undefined,
    json: boolean,
  ): Promise<T> {
    const response = await doFetch(`${base}/accounts/${options.accountId}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${options.apiToken}`,
        // A multipart body gets its boundary from `fetch`: no content type of ours.
        ...(body !== undefined && json ? { "content-type": "application/json" } : {}),
      },
      ...(body === undefined ? {} : { body }),
    });
    const envelope = (await response.json().catch(() => undefined)) as Envelope<T> | undefined;
    if (!response.ok || !envelope?.success) {
      const detail = envelope?.errors?.map((e) => e.message).join("; ") || response.statusText;
      throw new CloudflareError(
        `Cloudflare ${method} ${path} failed (${response.status}): ${detail}`,
        response.status,
      );
    }
    return envelope.result;
  }
  return {
    accountId: options.accountId,
    request: <T>(method: string, path: string, body?: unknown) =>
      send<T>(method, path, body === undefined ? undefined : JSON.stringify(body), true),
    form: <T>(method: string, path: string, body: FormData) => send<T>(method, path, body, false),
  };
}
