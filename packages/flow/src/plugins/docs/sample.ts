// Small graphs for the JSON samples of the plugin docs. Plain data, written as the editor writes it.

interface Port {
  id: string;
  type?: string;
  multiple?: boolean;
  label?: string;
}

export const sampleNode = (
  id: string,
  type: string,
  x: number,
  inputs: Port[],
  outputs: Port[],
  data: unknown = null,
) => ({ id, type, position: { x, y: 0 }, size: { w: 240, h: 80 }, inputs, outputs, data });

export const sampleEdge = (id: string, from: [string, string], to: [string, string]) => ({
  id,
  from: { node: from[0], port: from[1] },
  to: { node: to[0], port: to[1] },
});

/** A flow document as pretty JSON. */
export const sampleFlow = (
  nodes: ReadonlyArray<unknown>,
  edges: ReadonlyArray<unknown> = [],
  groups: ReadonlyArray<unknown> = [],
) => JSON.stringify({ version: 1, nodes, edges, groups }, null, 2);
