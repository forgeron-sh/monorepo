// Nodes, editor half: the body of every kind of node nobody else draws. It is what `renderNode` of
// `<FlowCanvas>` is: your body in the box the host draws with its ports. Without a body it shows
// the node's type and id, so a flow with no `renderNode` still reads.

import { defineEditorPlugin } from "../../react/plugin";
import { nodes as nodesCore } from "../ui";

export const nodes = defineEditorPlugin({
  core: nodesCore,
  nodeRenderers: {
    "*": (node, state, host) =>
      host.renderNode ? (
        host.renderNode(node, state)
      ) : (
        <div className="fg-flow-node-plain">
          {host.nodeLabel ? host.nodeLabel(node) : `${node.type} ${node.id}`}
        </div>
      ),
  },
});
