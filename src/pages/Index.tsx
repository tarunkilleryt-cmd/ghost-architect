import { useState, useMemo, useCallback } from 'react';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { GraphHeader } from '@/components/graph/GraphHeader';
import { GraphLegend } from '@/components/graph/GraphLegend';
import { AISidebar } from '@/components/ai/AISidebar';
import { mockNodes, mockEdges } from '@/data/mockGraphData';
import { FileNode } from '@/types/graph';

const Index = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
    typescript: true,
    javascript: true,
    core: true,
    utility: true,
    interface: true,
    configuration: true,
  });

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    return mockNodes.filter((node) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          node.name.toLowerCase().includes(query) ||
          node.path.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Language filter
      if (node.language === 'typescript' && !filters.typescript) return false;
      if (node.language === 'javascript' && !filters.javascript) return false;

      // Category filter
      if (node.category === 'core' && !filters.core) return false;
      if (node.category === 'utility' && !filters.utility) return false;
      if (node.category === 'interface' && !filters.interface) return false;
      if (node.category === 'configuration' && !filters.configuration) return false;

      return true;
    });
  }, [searchQuery, filters]);

  // Filter edges to only include those connecting visible nodes
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return mockEdges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
  }, [filteredNodes]);

  // Get selected node
  const selectedNode = useMemo(() => {
    return filteredNodes.find((n) => n.id === selectedNodeId) || null;
  }, [filteredNodes, selectedNodeId]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Handle node selection
  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <GraphHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Main content */}
      <div className="relative flex-1">
        {/* Graph Canvas */}
        <GraphCanvas
          nodes={filteredNodes}
          edges={filteredEdges}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
        />

        {/* Legend */}
        <GraphLegend />

        {/* AI Sidebar */}
        <AISidebar
          selectedNode={selectedNode}
          nodes={filteredNodes}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectNode={handleSelectNode}
        />
      </div>
    </div>
  );
};

export default Index;
