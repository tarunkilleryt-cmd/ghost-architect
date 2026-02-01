import { DependencyEdge, EdgeType, FileNode } from '@/types/graph';

interface GraphEdgeProps {
  edge: DependencyEdge;
  sourceNode: FileNode;
  targetNode: FileNode;
  isActive: boolean;
  isHighlighted: boolean;
}

const getEdgeColor = (type: EdgeType, isActive: boolean): string => {
  if (isActive) return 'hsl(var(--edge-active))';
  
  switch (type) {
    case 'import':
      return 'hsl(var(--edge-import))';
    case 'inheritance':
      return 'hsl(var(--edge-inheritance))';
    case 'composition':
      return 'hsl(var(--edge-composition))';
    case 'call':
    default:
      return 'hsl(var(--edge-default))';
  }
};

export function GraphEdge({
  edge,
  sourceNode,
  targetNode,
  isActive,
  isHighlighted,
}: GraphEdgeProps) {
  const color = getEdgeColor(edge.type, isActive);
  const strokeWidth = isActive ? 3 : isHighlighted ? 2.5 : 1.5;
  const opacity = isActive ? 1 : isHighlighted ? 0.9 : 0.5;

  // Calculate control point for curved edge
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;

  // Offset the control point perpendicular to the line
  const len = Math.sqrt(dx * dx + dy * dy);
  const offsetAmount = Math.min(30, len * 0.15);
  const nx = -dy / len;
  const ny = dx / len;
  const ctrlX = midX + nx * offsetAmount;
  const ctrlY = midY + ny * offsetAmount;

  // Arrow marker positioning
  const arrowSize = 8;
  const angle = Math.atan2(targetNode.y - ctrlY, targetNode.x - ctrlX);
  const targetRadius = 24 + targetNode.importance * 32 / 2 + 5;
  const arrowX = targetNode.x - Math.cos(angle) * targetRadius;
  const arrowY = targetNode.y - Math.sin(angle) * targetRadius;

  return (
    <g className={isActive ? 'graph-edge-active' : 'graph-edge'}>
      {/* Edge path */}
      <path
        d={`M ${sourceNode.x} ${sourceNode.y} Q ${ctrlX} ${ctrlY} ${arrowX} ${arrowY}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={opacity}
        strokeLinecap="round"
        className="transition-all duration-200"
      />

      {/* Arrowhead */}
      <polygon
        points={`0,${-arrowSize / 2} ${arrowSize},0 0,${arrowSize / 2}`}
        fill={color}
        opacity={opacity}
        transform={`translate(${arrowX}, ${arrowY}) rotate(${(angle * 180) / Math.PI})`}
        className="transition-all duration-200"
      />
    </g>
  );
}
