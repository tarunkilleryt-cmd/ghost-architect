import { FileNode, ImportanceLevel, Language } from '@/types/graph';
import { cn } from '@/lib/utils';
import { FileCode, FileJson, FileType } from 'lucide-react';

interface GraphNodeProps {
  node: FileNode;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  scale: number;
}

const getNodeSize = (importance: number): number => {
  return 24 + importance * 32;
};

const getLanguageIcon = (language: Language) => {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return FileCode;
    case 'python':
    case 'java':
    case 'csharp':
      return FileType;
    default:
      return FileJson;
  }
};

const getImportanceColor = (level: ImportanceLevel): string => {
  switch (level) {
    case 'critical':
      return 'hsl(var(--node-critical))';
    case 'high':
      return 'hsl(var(--node-high))';
    case 'medium':
      return 'hsl(var(--node-medium))';
    case 'low':
    default:
      return 'hsl(var(--node-low))';
  }
};

export function GraphNode({
  node,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  scale,
}: GraphNodeProps) {
  const size = getNodeSize(node.importance);
  const Icon = getLanguageIcon(node.language);
  const color = getImportanceColor(node.importanceLevel);

  return (
    <g
      className="graph-node cursor-pointer"
      transform={`translate(${node.x}, ${node.y})`}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Glow effect for selected/hovered state */}
      {(isSelected || isHovered) && (
        <circle
          r={size / 2 + 8}
          fill="none"
          stroke={isSelected ? 'hsl(var(--node-selected))' : 'hsl(var(--node-hover))'}
          strokeWidth={3}
          opacity={0.6}
        />
      )}

      {/* Main node circle */}
      <circle
        r={size / 2}
        fill={color}
        stroke={isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--border))'}
        strokeWidth={isSelected ? 3 : 1.5}
        className="transition-all duration-200"
        style={{
          filter: isHovered ? 'brightness(1.15)' : 'none',
        }}
      />

      {/* Icon in center */}
      <foreignObject
        x={-size / 4}
        y={-size / 4}
        width={size / 2}
        height={size / 2}
        className="pointer-events-none"
      >
        <div className="flex h-full w-full items-center justify-center">
          <Icon
            className="text-white drop-shadow-sm"
            style={{
              width: size / 3,
              height: size / 3,
            }}
          />
        </div>
      </foreignObject>

      {/* Node label */}
      <text
        y={size / 2 + 14}
        textAnchor="middle"
        className="pointer-events-none fill-foreground text-xs font-medium"
        style={{ fontSize: Math.max(10, 12 * scale) }}
      >
        {node.name.length > 15 ? node.name.slice(0, 12) + '...' : node.name}
      </text>

      {/* Importance badge */}
      <g transform={`translate(${size / 2 - 4}, ${-size / 2 + 4})`}>
        <circle r={8} fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth={1} />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-[8px] font-bold"
        >
          {Math.round(node.importance * 100)}
        </text>
      </g>
    </g>
  );
}
