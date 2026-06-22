import dagre from 'dagre';
import { type Node, type Edge } from '@xyflow/react';

export function getAutoLayout(nodes: Node[], edges: Edge[], direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 200 });

  const getDimensions = (node: Node) => {
    if (node.type === 'os-panel') {
      const size = node.data?.size as { width: number, height: number } | undefined;
      return { width: size?.width ?? 340, height: size?.height ?? 600 };
    }
    return { width: 250, height: 150 };
  };

  const layoutNodes = nodes.filter(n => n.type !== 'os-panel');

  layoutNodes.forEach((node) => {
    const { width, height } = getDimensions(node);
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    if (node.type === 'os-panel') return node;

    const nodeWithPosition = dagreGraph.node(node.id);
    const { width, height } = getDimensions(node);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
    };
  });

  return { nodes: newNodes, edges };
}
