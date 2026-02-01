import { useState, useMemo, useCallback } from 'react';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { GraphHeader } from '@/components/graph/GraphHeader';
import { GraphLegend } from '@/components/graph/GraphLegend';
import { AISidebar } from '@/components/ai/AISidebar';
import { AnalyzePanel } from '@/components/graph/AnalyzePanel';
import { useGraphState } from '@/hooks/useGraphState';
import { parseInput, filesToNodes, generateEdges, isGitHubUrl, parseGitHubUrl, ParsedFile } from '@/lib/structureParser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileNode } from '@/types/graph';

const Index = () => {
  const {
    nodes,
    edges,
    projectName,
    isLoading,
    isAnalyzing,
    savedProjects,
    setNodes,
    setEdges,
    setProjectName,
    updateNodesFromAnalysis,
    saveProject,
    loadProject,
    setIsAnalyzing,
  } = useGraphState();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    typescript: true,
    javascript: true,
    core: true,
    utility: true,
    interface: true,
    configuration: true,
  });

  // Handle analyze input
  const handleAnalyze = useCallback(async (input: string, name: string) => {
    setIsAnalyzing(true);
    
    try {
      // Parse the input
      const parsed = parseInput(input);
      
      if (isGitHubUrl(input)) {
        const ghParsed = parseGitHubUrl(input);
        if (ghParsed) {
          toast.info(`GitHub URL detected: ${ghParsed.owner}/${ghParsed.repo}. For now, please paste the folder structure directly.`);
          setIsAnalyzing(false);
          return;
        }
      }

      if (parsed.files.length === 0) {
        toast.error('No code files detected. Make sure to include files with extensions like .ts, .tsx, .js, .py');
        setIsAnalyzing(false);
        return;
      }

      toast.info(`Detected ${parsed.files.length} code files. Analyzing...`);

      // Generate initial nodes from parsed files
      const initialNodes = filesToNodes(parsed.files);
      const initialEdges = generateEdges(initialNodes);
      
      setNodes(initialNodes);
      setEdges(initialEdges);
      setProjectName(name || parsed.projectName);

      // Call AI to analyze the structure
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const response = await supabase.functions.invoke('analyze-structure', {
          body: {
            files: parsed.files,
            projectName: name || parsed.projectName,
          },
        });

        if (response.error) {
          console.error('Analysis error:', response.error);
          toast.warning('AI analysis unavailable, using rule-based analysis');
        } else if (response.data?.analyses) {
          // Update nodes with AI analysis
          updateNodesFromAnalysis(response.data.analyses);
          toast.success(`Analysis complete! Generated ${initialNodes.length} nodes with AI insights.`);
        }
      } else {
        toast.success(`Generated ${initialNodes.length} nodes from structure (login for AI analysis)`);
      }

    } catch (error) {
      console.error('Analyze error:', error);
      toast.error('Failed to analyze structure');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setNodes, setEdges, setProjectName, updateNodesFromAnalysis, setIsAnalyzing]);

  // Handle analyze from dropped files
  const handleAnalyzeFiles = useCallback(async (files: ParsedFile[], name: string) => {
    setIsAnalyzing(true);
    
    try {
      if (files.length === 0) {
        toast.error('No code files detected');
        setIsAnalyzing(false);
        return;
      }

      toast.info(`Detected ${files.length} code files. Analyzing...`);

      // Generate initial nodes from files
      const initialNodes = filesToNodes(files);
      const initialEdges = generateEdges(initialNodes);
      
      setNodes(initialNodes);
      setEdges(initialEdges);
      setProjectName(name);

      // Call AI to analyze the structure
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const response = await supabase.functions.invoke('analyze-structure', {
          body: {
            files: files,
            projectName: name,
          },
        });

        if (response.error) {
          console.error('Analysis error:', response.error);
          toast.warning('AI analysis unavailable, using rule-based analysis');
        } else if (response.data?.analyses) {
          updateNodesFromAnalysis(response.data.analyses);
          toast.success(`Analysis complete! Generated ${initialNodes.length} nodes with AI insights.`);
        }
      } else {
        toast.success(`Generated ${initialNodes.length} nodes from files (login for AI analysis)`);
      }

    } catch (error) {
      console.error('Analyze error:', error);
      toast.error('Failed to analyze structure');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setNodes, setEdges, setProjectName, updateNodesFromAnalysis, setIsAnalyzing]);

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
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
  }, [nodes, searchQuery, filters]);

  // Filter edges to only include those connecting visible nodes
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
  }, [filteredNodes, edges]);

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

  // Handle search results highlighting
  const handleHighlightNodes = useCallback((nodeIds: string[]) => {
    setHighlightedNodeIds(nodeIds);
  }, []);

  // Clear highlights
  const handleClearHighlights = useCallback(() => {
    setHighlightedNodeIds([]);
  }, []);

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
        {/* Analyze Panel with Drag & Drop */}
        <AnalyzePanel
          onAnalyze={handleAnalyze}
          onAnalyzeFiles={handleAnalyzeFiles}
          onSave={saveProject}
          onLoadProject={loadProject}
          savedProjects={savedProjects}
          isAnalyzing={isAnalyzing}
          isLoading={isLoading}
          currentProjectName={projectName}
          onProjectNameChange={setProjectName}
        />

        {/* Graph Canvas */}
        <GraphCanvas
          nodes={filteredNodes}
          edges={filteredEdges}
          selectedNodeId={selectedNodeId}
          highlightedNodeIds={highlightedNodeIds}
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
          onHighlightNodes={handleHighlightNodes}
          onClearHighlights={handleClearHighlights}
        />
      </div>
    </div>
  );
};

export default Index;
