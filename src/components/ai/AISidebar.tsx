import { useState } from 'react';
import { FileNode, ImportanceLevel } from '@/types/graph';
import { mockExplanations } from '@/data/mockGraphData';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileCode,
  GitBranch,
  Lightbulb,
  BookOpen,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

export function AISidebar({
  selectedNode,
  nodes,
  isOpen,
  onToggle,
  onSelectNode,
}: AISidebarProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    patterns: true,
    suggestions: true,
    learning: false,
  });

  const explanation = selectedNode
    ? mockExplanations[selectedNode.id]
    : null;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get suggested learning path based on dependencies
  const getLearningPath = () => {
    if (!selectedNode) return [];
    return nodes
      .filter((n) => selectedNode.dependencies.includes(n.id))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 4);
  };

  return (
    <>
      {/* Toggle button when closed */}
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

      {/* Sidebar panel */}
      <div
        className={cn(
          'absolute right-0 top-0 z-10 h-full bg-sidebar border-l border-sidebar-border shadow-xl transition-all duration-300',
          isOpen ? 'w-96' : 'w-0'
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
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getImportanceBadgeVariant(selectedNode.importanceLevel)}>
                        {selectedNode.importanceLevel} importance
                      </Badge>
                      <Badge variant="outline">{selectedNode.category}</Badge>
                      <Badge variant="outline">{selectedNode.language}</Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* AI Summary */}
                  {explanation ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-sidebar-accent/50 p-3">
                        <p className="text-sm text-sidebar-foreground leading-relaxed">
                          {explanation.summary}
                        </p>
                      </div>

                      {/* Details section */}
                      <Collapsible
                        open={expandedSections.details}
                        onOpenChange={() => toggleSection('details')}
                      >
                        <CollapsibleTrigger asChild>
                          <button className="flex w-full items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4 w-4 text-sidebar-foreground/60" />
                              <span className="text-sm font-medium text-sidebar-foreground">
                                File Details
                              </span>
                            </div>
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 text-sidebar-foreground/60 transition-transform',
                                expandedSections.details && 'rotate-90'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <ul className="space-y-2 pl-6 pb-2">
                            {explanation.details.map((detail, i) => (
                              <li
                                key={i}
                                className="text-sm text-sidebar-foreground/80 list-disc"
                              >
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Patterns section */}
                      <Collapsible
                        open={expandedSections.patterns}
                        onOpenChange={() => toggleSection('patterns')}
                      >
                        <CollapsibleTrigger asChild>
                          <button className="flex w-full items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4 text-sidebar-foreground/60" />
                              <span className="text-sm font-medium text-sidebar-foreground">
                                Design Patterns
                              </span>
                            </div>
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 text-sidebar-foreground/60 transition-transform',
                                expandedSections.patterns && 'rotate-90'
                              )}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="flex flex-wrap gap-2 pl-6 pb-2">
                            {explanation.patterns.map((pattern, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Suggestions section */}
                      <Collapsible
                        open={expandedSections.suggestions}
                        onOpenChange={() => toggleSection('suggestions')}
                      >
                        <CollapsibleTrigger asChild>
                          <button className="flex w-full items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-sidebar-foreground/60" />
                              <span className="text-sm font-medium text-sidebar-foreground">
                                Suggested Next Steps
                              </span>
                            </div>
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 text-sidebar-foreground/60 transition-transform',
                                expandedSections.suggestions && 'rotate-90'
                              )}
                            />
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
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-sidebar-foreground/60">
                        AI analysis not available for this file.
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Learning path */}
                  <Collapsible
                    open={expandedSections.learning}
                    onOpenChange={() => toggleSection('learning')}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-sidebar-foreground/60" />
                          <span className="text-sm font-medium text-sidebar-foreground">
                            Learning Path
                          </span>
                        </div>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 text-sidebar-foreground/60 transition-transform',
                            expandedSections.learning && 'rotate-90'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-2 pb-2">
                        <p className="text-xs text-sidebar-foreground/60 mb-3">
                          Explore these dependencies next:
                        </p>
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
                                {node.category}
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
                    </CollapsibleContent>
                  </Collapsible>

                  {/* File stats */}
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
                    Click on any node in the graph to see AI-powered insights and explanations.
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
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
