// The small part of `ws` that the local host and its tests use (D-135); the package ships no types of its own.
declare module "ws" {
  import type { IncomingMessage } from "node:http";
  import type { Duplex } from "node:stream";

  export class WebSocket {
    constructor(url: string);
    send(data: string): void;
    close(code?: number, reason?: string): void;
    on(event: "message", listener: (data: { toString(): string }) => void): void;
    on(event: "open" | "close", listener: () => void): void;
    on(event: "error", listener: (error: Error) => void): void;
  }
  export class WebSocketServer {
    constructor(options: { noServer: true });
    handleUpgrade(
      request: IncomingMessage,
      socket: Duplex,
      head: Buffer,
      callback: (socket: WebSocket) => void,
    ): void;
  }
}
