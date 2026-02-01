import { useRef, useState, useCallback, useEffect } from 'react';
import { FileNode, DependencyEdge } from '@/types/graph';
import { GraphNode } from './GraphNode';
import { GraphEdge } from './GraphEdge';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraphCanvasProps {
  nodes: FileNode[];
  edges: DependencyEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

export function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Get node by ID
  const getNodeById = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes]
  );

  // Check if edge connects to selected or hovered node
  const isEdgeHighlighted = useCallback(
    (edge: DependencyEdge) => {
      const activeId = selectedNodeId || hoveredNodeId;
      if (!activeId) return false;
      return edge.source === activeId || edge.target === activeId;
    },
    [selectedNodeId, hoveredNodeId]
  );

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom((z) => Math.min(2, Math.max(0.3, z + delta)));
  }, []);

  // Handle reset view
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
    }
  }, [handleZoom]);

  // Handle panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.target === svgRef.current || (e.target as Element).classList.contains('graph-background'))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Click on background deselects
  const handleBackgroundClick = useCallback(() => {
    onSelectNode(null);
  }, [onSelectNode]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-graph-background"
    >
      {/* Zoom controls */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => handleZoom(0.2)}
          className="h-9 w-9 shadow-md"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => handleZoom(-0.2)}
          className="h-9 w-9 shadow-md"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleResetView}
          className="h-9 w-9 shadow-md"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 left-4 z-10 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground shadow-md">
        {Math.round(zoom * 100)}%
      </div>

      <svg
        ref={svgRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid pattern */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x % 40},${pan.y % 40}) scale(${zoom})`}
          >
            <circle cx="20" cy="20" r="1" fill="hsl(var(--graph-grid))" />
          </pattern>
        </defs>

        {/* Background with grid */}
        <rect
          className="graph-background"
          width="100%"
          height="100%"
          fill="url(#grid)"
          onClick={handleBackgroundClick}
        />

        {/* Main graph group with pan and zoom transform */}
        <g transform={`translate(${pan.x + 100}, ${pan.y + 50}) scale(${zoom})`}>
          {/* Edges layer (rendered first, below nodes) */}
          <g className="edges-layer">
            {edges.map((edge) => {
              const sourceNode = getNodeById(edge.source);
              const targetNode = getNodeById(edge.target);
              if (!sourceNode || !targetNode) return null;

              return (
                <GraphEdge
                  key={edge.id}
                  edge={edge}
                  sourceNode={sourceNode}
                  targetNode={targetNode}
                  isActive={
                    edge.source === selectedNodeId || edge.target === selectedNodeId
                  }
                  isHighlighted={isEdgeHighlighted(edge)}
                />
              );
            })}
          </g>

          {/* Nodes layer */}
          <g className="nodes-layer">
            {nodes.map((node) => (
              <GraphNode
                key={node.id}
                node={node}
                isSelected={node.id === selectedNodeId}
                isHovered={node.id === hoveredNodeId}
                onSelect={onSelectNode}
                onHover={setHoveredNodeId}
                scale={zoom}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
