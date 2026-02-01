import { useState, useCallback, useEffect } from 'react';
import { FileNode, DependencyEdge } from '@/types/graph';
import { supabase } from '@/integrations/supabase/client';
import { mockNodes, mockEdges } from '@/data/mockGraphData';
import { toast } from 'sonner';

interface ProjectData {
  id: string;
  name: string;
  nodes: FileNode[];
  edges: DependencyEdge[];
  createdAt: string;
}

interface UseGraphStateReturn {
  nodes: FileNode[];
  edges: DependencyEdge[];
  projectName: string;
  isLoading: boolean;
  isAnalyzing: boolean;
  savedProjects: ProjectData[];
  setNodes: (nodes: FileNode[]) => void;
  setEdges: (edges: DependencyEdge[]) => void;
  setProjectName: (name: string) => void;
  updateNodesFromAnalysis: (analysisResults: AnalysisResult[]) => void;
  saveProject: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  loadSavedProjects: () => Promise<void>;
  resetToMockData: () => void;
  setIsAnalyzing: (value: boolean) => void;
}

interface AnalysisResult {
  filePath: string;
  importance: number;
  category: string;
  connections: string[];
}

export function useGraphState(): UseGraphStateReturn {
  const [nodes, setNodes] = useState<FileNode[]>(mockNodes);
  const [edges, setEdges] = useState<DependencyEdge[]>(mockEdges);
  const [projectName, setProjectName] = useState<string>('Demo Project');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);

  // Update nodes with AI analysis results
  const updateNodesFromAnalysis = useCallback((analysisResults: AnalysisResult[]) => {
    setNodes(prevNodes => {
      const updatedNodes = prevNodes.map(node => {
        const analysis = analysisResults.find(r => 
          r.filePath === node.path || 
          r.filePath.endsWith(node.name)
        );
        
        if (analysis) {
          const importance = analysis.importance / 100;
          return {
            ...node,
            importance,
            importanceLevel: importance >= 0.8 ? 'critical' as const :
                            importance >= 0.6 ? 'high' as const :
                            importance >= 0.4 ? 'medium' as const : 'low' as const,
            category: (analysis.category || node.category) as any,
            dependencies: analysis.connections || node.dependencies,
          };
        }
        return node;
      });
      return updatedNodes;
    });

    // Generate new edges based on analysis connections
    setEdges(prevEdges => {
      const newEdges: DependencyEdge[] = [...prevEdges];
      const existingEdgeIds = new Set(prevEdges.map(e => e.id));

      for (const result of analysisResults) {
        if (result.connections) {
          const sourceNode = nodes.find(n => 
            n.path === result.filePath || n.name === result.filePath
          );
          
          if (sourceNode) {
            for (const connection of result.connections) {
              const targetNode = nodes.find(n => 
                n.path.includes(connection) || n.name.includes(connection)
              );
              
              if (targetNode) {
                const edgeId = `${sourceNode.id}-${targetNode.id}`;
                if (!existingEdgeIds.has(edgeId)) {
                  newEdges.push({
                    id: edgeId,
                    source: sourceNode.id,
                    target: targetNode.id,
                    type: 'import',
                    strength: 0.7,
                  });
                  existingEdgeIds.add(edgeId);
                }
              }
            }
          }
        }
      }

      return newEdges;
    });
  }, [nodes]);

  // Save current project to Supabase
  const saveProject = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save projects');
        return;
      }

      // Store nodes and edges as JSON in description (simplified approach)
      const graphData = JSON.stringify({ nodes, edges });
      
      const { data, error } = await supabase
        .from('projects')
        .upsert({
          user_id: user.id,
          name: projectName,
          description: graphData,
          repository_url: null,
        }, {
          onConflict: 'user_id,name',
        })
        .select()
        .single();

      if (error) {
        // If upsert fails, try insert
        const { data: insertData, error: insertError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectName,
            description: graphData,
          })
          .select()
          .single();

        if (insertError) throw insertError;
      }

      toast.success(`Project "${projectName}" saved successfully!`);
      await loadSavedProjects();
    } catch (error) {
      console.error('Save project error:', error);
      toast.error('Failed to save project');
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, projectName]);

  // Load a project from Supabase
  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data && data.description) {
        try {
          const graphData = JSON.parse(data.description);
          if (graphData.nodes && graphData.edges) {
            setNodes(graphData.nodes);
            setEdges(graphData.edges);
            setProjectName(data.name);
            toast.success(`Loaded project "${data.name}"`);
          }
        } catch (parseError) {
          console.error('Failed to parse project data:', parseError);
          toast.error('Failed to load project data');
        }
      }
    } catch (error) {
      console.error('Load project error:', error);
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all saved projects
  const loadSavedProjects = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at, description')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const projects: ProjectData[] = (data || []).map(p => {
        let nodes: FileNode[] = [];
        let edges: DependencyEdge[] = [];
        
        if (p.description) {
          try {
            const parsed = JSON.parse(p.description);
            nodes = parsed.nodes || [];
            edges = parsed.edges || [];
          } catch {}
        }

        return {
          id: p.id,
          name: p.name,
          nodes,
          edges,
          createdAt: p.created_at,
        };
      });

      setSavedProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  // Reset to mock data
  const resetToMockData = useCallback(() => {
    setNodes(mockNodes);
    setEdges(mockEdges);
    setProjectName('Demo Project');
  }, []);

  // Load saved projects on mount
  useEffect(() => {
    loadSavedProjects();
  }, [loadSavedProjects]);

  return {
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
    loadSavedProjects,
    resetToMockData,
    setIsAnalyzing,
  };
}
