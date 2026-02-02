import { useState, useEffect, useCallback } from 'react';
import { FileNode, ImportanceLevel } from '@/types/graph';
import { SearchResponse } from '@/types/search';
import { mockExplanations } from '@/data/mockGraphData';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { SearchResultsPanel } from './SearchResultsPanel';
import {
  ChevronRight,
  Sparkles,
  FileCode,
  GitBranch,
  Lightbulb,
  BookOpen,
  Loader2,
  X,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  FileText,
  Link2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface AISidebarProps {
  selectedNode: FileNode | null;
  nodes: FileNode[];
  isOpen: boolean;
  onToggle: () => void;
  onSelectNode: (id: string) => void;
  onHighlightNodes: (nodeIds: string[]) => void;
  onClearHighlights: () => void;
}

interface Concept {
  id: string;
  concept_name: string;
  content_markdown: string;
  difficulty_level: 'beginner' | 'intermediate' | 'expert';
}

interface StoredAnalysis {
  id: string;
  file_path: string;
  ai_summary: string | null;
  importance_score: number | null;
  category: string | null;
  language: string | null;
  code_knowledge: Concept[];
}

const getImportanceBadgeVariant = (
  level: ImportanceLevel
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (level) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getDifficultyColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'bg-primary/20 text-primary';
    case 'intermediate':
      return 'bg-accent text-accent-foreground';
    case 'expert':
      return 'bg-destructive/20 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string | null) => {
  switch (status) {
    case 'understood':
      return <CheckCircle className="h-4 w-4 text-primary" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-accent-foreground" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export function AISidebar({
  selectedNode,
  nodes,
  isOpen,
  onToggle,
  onSelectNode,
  onHighlightNodes,
  onClearHighlights,
}: AISidebarProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const [learningStatus, setLearningStatus] = useState<string | null>(null);
  const [storedAnalysis, setStoredAnalysis] = useState<StoredAnalysis | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);

  const { 
    analyzeFile, 
    getStoredAnalysis, 
    updateLearningProgress, 
    getLearningProgress,
    searchKnowledge,
    isAnalyzing,
    isLoading,
    isSearching 
  } = useCodeAnalysis();

  // Load stored analysis when node changes
  const loadAnalysis = useCallback(async () => {
    if (selectedNode) {
      const data = await getStoredAnalysis(selectedNode.path);
      setStoredAnalysis(data);
      
      if (data?.id) {
        const progress = await getLearningProgress(data.id);
        setLearningStatus(progress?.status || null);
      } else {
        setLearningStatus(null);
      }
    } else {
      setStoredAnalysis(null);
      setLearningStatus(null);
    }
  }, [selectedNode, getStoredAnalysis, getLearningProgress]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const explanation = selectedNode
    ? mockExplanations[selectedNode.id]
    : null;

  const handleAnalyze = async () => {
    if (!selectedNode) return;
    
    const mockContent = `// ${selectedNode.name}\n// This is a demo file for analysis\nexport function example() {\n  console.log('Hello');\n}`;
    
    const result = await analyzeFile(
      mockContent,
      selectedNode.path,
      selectedNode.name,
      selectedNode.language
    );
    
    if (result) {
      await loadAnalysis();
    }
  };

  const handleStatusChange = async (status: 'understood' | 'need_review' | 'in_progress') => {
    if (storedAnalysis?.id) {
      await updateLearningProgress(storedAnalysis.id, status);
      setLearningStatus(status);
    }
  };

  // Handle AI search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const response = await searchKnowledge(searchQuery);
    setSearchResponse(response);
    
    // Highlight matching nodes on the graph
    if (response?.files) {
      const matchingNodeIds = response.files
        .map(f => {
          const node = nodes.find(n => n.path === f.file_path);
          return node?.id;
        })
        .filter((id): id is string => !!id);
      
      onHighlightNodes(matchingNodeIds);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResponse(null);
    onClearHighlights();
  };

  // Get suggested learning path
  const getLearningPath = () => {
    if (!selectedNode) return [];
    return nodes
      .filter((n) => selectedNode.dependencies.includes(n.id))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 4);
  };

  // Get related files
  const getRelatedDocs = () => {
    if (!selectedNode) return [];
    const dir = selectedNode.path.split('/').slice(0, -1).join('/');
    return nodes
      .filter((n) => n.id !== selectedNode.id && n.path.startsWith(dir))
      .slice(0, 5);
  };

  const concepts = storedAnalysis?.code_knowledge || [];

  return (
    <>
      {!isOpen && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggle}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-full shadow-lg"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      )}

      <div
        className={cn(
          'absolute right-0 top-0 z-10 h-full bg-sidebar border-l border-sidebar-border shadow-xl transition-all duration-300',
          isOpen ? 'w-[420px]' : 'w-0'
        )}
      >
        {isOpen && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sidebar-primary" />
                <span className="font-semibold text-sidebar-foreground">
                  AI Insights
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Search */}
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ask about the codebase..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9 pr-8"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={handleClearSearch}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !searchQuery.trim()}
                  size="sm"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>

            {/* Show Search Results Panel or Regular Content */}
            {searchResponse ? (
              <SearchResultsPanel
                response={searchResponse}
                nodes={nodes}
                query={searchQuery}
                onSelectNode={(id) => {
                  onSelectNode(id);
                  setSearchResponse(null);
                  setSearchQuery('');
                  onClearHighlights();
                }}
                onClear={handleClearSearch}
              />
            ) : (
            <ScrollArea className="flex-1">
              {selectedNode ? (
                <div className="p-4 space-y-4">
                  {/* Selected file header */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-sidebar-accent p-2">
                        <FileCode className="h-5 w-5 text-sidebar-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sidebar-foreground truncate">
                          {selectedNode.name}
                        </h3>
                        <p className="text-xs text-sidebar-foreground/60 truncate">
                          {selectedNode.path}
                        </p>
                      </div>
                      {getStatusIcon(learningStatus)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getImportanceBadgeVariant(selectedNode.importanceLevel)}>
                        {selectedNode.importanceLevel} importance
                      </Badge>
                      <Badge variant="outline">{selectedNode.category}</Badge>
                      <Badge variant="outline">{selectedNode.language}</Badge>
                    </div>
                  </div>

                  {!storedAnalysis?.ai_summary && (
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                  )}

                  {isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-sidebar-primary" />
                    </div>
                  )}

                  {!isLoading && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Summary
                        </TabsTrigger>
                        <TabsTrigger value="deepdive" className="text-xs">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Deep Dive
                        </TabsTrigger>
                        <TabsTrigger value="related" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          Related
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="space-y-4 mt-4">
                        {storedAnalysis?.ai_summary && (
                          <div className="rounded-lg bg-gradient-to-br from-sidebar-primary/10 to-sidebar-accent/30 p-3 border border-sidebar-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-sidebar-primary" />
                              <span className="text-xs font-medium text-sidebar-primary">AI Analysis</span>
                            </div>
                            <p className="text-sm text-sidebar-foreground leading-relaxed">
                              {storedAnalysis.ai_summary}
                            </p>
                          </div>
                        )}

                        {!storedAnalysis?.ai_summary && explanation && (
                          <div className="rounded-lg bg-sidebar-accent/50 p-3">
                            <p className="text-sm text-sidebar-foreground leading-relaxed">
                              {explanation.summary}
                            </p>
                          </div>
                        )}

                        {storedAnalysis && (
                          <div className="flex gap-2">
                            <Button
                              variant={learningStatus === 'understood' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange('understood')}
                              className="flex-1"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Got it
                            </Button>
                            <Button
                              variant={learningStatus === 'in_progress' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange('in_progress')}
                              className="flex-1"
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Studying
                            </Button>
                            <Button
                              variant={learningStatus === 'need_review' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange('need_review')}
                              className="flex-1"
                            >
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Review
                            </Button>
                          </div>
                        )}

                        {explanation && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4 text-sidebar-foreground/60" />
                              <span className="text-sm font-medium text-sidebar-foreground">
                                Design Patterns
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {explanation.patterns.map((pattern, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="rounded-lg bg-sidebar-accent/30 p-3 space-y-2">
                          <h4 className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide">
                            File Statistics
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-sidebar-foreground/60">Size:</span>{' '}
                              <span className="font-medium text-sidebar-foreground">
                                {selectedNode.size} bytes
                              </span>
                            </div>
                            <div>
                              <span className="text-sidebar-foreground/60">Complexity:</span>{' '}
                              <span className="font-medium text-sidebar-foreground">
                                {selectedNode.complexity}
                              </span>
                            </div>
                            <div>
                              <span className="text-sidebar-foreground/60">Functions:</span>{' '}
                              <span className="font-medium text-sidebar-foreground">
                                {selectedNode.functions.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-sidebar-foreground/60">Classes:</span>{' '}
                              <span className="font-medium text-sidebar-foreground">
                                {selectedNode.classes.length}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!storedAnalysis?.ai_summary && !explanation && (
                          <div className="text-center py-6">
                            <p className="text-sm text-sidebar-foreground/60">
                              Click "Analyze with AI" to get insights for this file.
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="deepdive" className="space-y-4 mt-4">
                        {concepts.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-xs text-sidebar-foreground/60">
                              {concepts.length} concept{concepts.length > 1 ? 's' : ''} extracted:
                            </p>
                            {concepts.map((concept) => (
                              <div
                                key={concept.id}
                                className="rounded-lg border border-sidebar-border p-3 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-medium text-sidebar-foreground text-sm">
                                    {concept.concept_name}
                                  </h4>
                                  <Badge className={cn('text-xs capitalize', getDifficultyColor(concept.difficulty_level))}>
                                    {concept.difficulty_level}
                                  </Badge>
                                </div>
                                <p className="text-sm text-sidebar-foreground/80 leading-relaxed">
                                  {concept.content_markdown}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <GraduationCap className="h-10 w-10 text-sidebar-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-sidebar-foreground/60 mb-3">
                              No concepts extracted yet.
                            </p>
                            {!storedAnalysis && (
                              <Button 
                                onClick={handleAnalyze} 
                                disabled={isAnalyzing}
                                size="sm"
                              >
                                {isAnalyzing ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Analyze to Extract
                              </Button>
                            )}
                          </div>
                        )}

                        {explanation && (
                          <Collapsible defaultOpen>
                            <CollapsibleTrigger asChild>
                              <button className="flex w-full items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 text-sidebar-foreground/60" />
                                  <span className="text-sm font-medium text-sidebar-foreground">
                                    Learning Suggestions
                                  </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <ul className="space-y-2 pl-6 pb-2">
                                {explanation.suggestions.map((suggestion, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-sidebar-foreground/80"
                                  >
                                    <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" />
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </TabsContent>

                      <TabsContent value="related" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-sidebar-foreground/60" />
                            <span className="text-sm font-medium text-sidebar-foreground">
                              Learning Path
                            </span>
                          </div>
                          <p className="text-xs text-sidebar-foreground/60">
                            Explore dependencies to understand this better:
                          </p>
                          <div className="space-y-2">
                            {getLearningPath().map((node, i) => (
                              <button
                                key={node.id}
                                onClick={() => onSelectNode(node.id)}
                                className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors text-left"
                              >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {node.name}
                                  </p>
                                  <p className="text-xs text-sidebar-foreground/60">
                                    {node.category} • {node.importanceLevel}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-sidebar-foreground/40" />
                              </button>
                            ))}
                            {getLearningPath().length === 0 && (
                              <p className="text-xs text-sidebar-foreground/60 text-center py-2">
                                No dependencies to explore
                              </p>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-sidebar-foreground/60" />
                            <span className="text-sm font-medium text-sidebar-foreground">
                              Related Files
                            </span>
                          </div>
                          <div className="space-y-1">
                            {getRelatedDocs().map((node) => (
                              <button
                                key={node.id}
                                onClick={() => onSelectNode(node.id)}
                                className="flex w-full items-center gap-2 rounded-lg p-2 hover:bg-sidebar-accent transition-colors text-left"
                              >
                                <FileCode className="h-4 w-4 text-sidebar-foreground/60" />
                                <span className="text-sm text-sidebar-foreground truncate flex-1">
                                  {node.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {node.category}
                                </Badge>
                              </button>
                            ))}
                            {getRelatedDocs().length === 0 && (
                              <p className="text-xs text-sidebar-foreground/60 text-center py-2">
                                No related files found
                              </p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <div className="rounded-full bg-sidebar-accent p-4 mb-4">
                    <Sparkles className="h-8 w-8 text-sidebar-primary" />
                  </div>
                  <h3 className="font-semibold text-sidebar-foreground mb-2">
                    Select a File
                  </h3>
                  <p className="text-sm text-sidebar-foreground/60 max-w-[240px]">
                    Click on any node in the graph to see AI-powered insights.
                  </p>
                </div>
              )}
            </ScrollArea>
            )}

            <div className="border-t border-sidebar-border p-3">
              <p className="text-xs text-center text-sidebar-foreground/50">
                Powered by Ghost Architect AI
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
