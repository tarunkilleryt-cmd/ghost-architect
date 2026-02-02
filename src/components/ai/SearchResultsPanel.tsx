import { FileNode } from '@/types/graph';
import { SearchResponse, FileReference, LearningPathStep } from '@/types/search';
import ReactMarkdown from 'react-markdown';
import {
  FileCode,
  BookOpen,
  Sparkles,
  ChevronRight,
  GraduationCap,
  GitBranch,
  ArrowRight,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SearchResultsPanelProps {
  response: SearchResponse;
  nodes: FileNode[];
  query: string;
  onSelectNode: (id: string) => void;
  onClear: () => void;
}

const getDifficultyColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'intermediate':
      return 'bg-accent text-accent-foreground border-accent';
    case 'advanced':
      return 'bg-destructive/20 text-destructive border-destructive/30';
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
};

export function SearchResultsPanel({
  response,
  nodes,
  query,
  onSelectNode,
  onClear,
}: SearchResultsPanelProps) {
  const handleFileClick = (filePath: string) => {
    const node = nodes.find(n => n.path === filePath);
    if (node) {
      onSelectNode(node.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Query Header */}
      <div className="px-4 py-3 border-b border-sidebar-border bg-sidebar-accent/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Your question:</p>
            <p className="text-sm font-medium text-sidebar-foreground line-clamp-2">
              "{query}"
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant="outline" 
            className={cn('text-xs capitalize', getDifficultyColor(response.difficulty_level))}
          >
            {response.difficulty_level}
          </Badge>
          {response.patterns_detected && response.patterns_detected.length > 0 && (
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {response.patterns_detected.length} pattern(s)
              </span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Main Answer */}
          <div className="rounded-lg bg-gradient-to-br from-sidebar-primary/10 to-sidebar-accent/30 p-4 border border-sidebar-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-sidebar-primary" />
              <span className="text-xs font-medium text-sidebar-primary uppercase tracking-wide">
                Answer
              </span>
            </div>
            <p className="text-sm text-sidebar-foreground leading-relaxed font-medium">
              {response.answer}
            </p>
          </div>

          {/* Detailed Explanation */}
          {response.explanation && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between py-2 hover:bg-sidebar-accent/30 rounded-lg px-2 -mx-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-sidebar-foreground/60" />
                    <span className="text-sm font-medium text-sidebar-foreground">
                      Deep Explanation
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-sidebar-foreground/60 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="rounded-lg bg-sidebar-accent/20 p-3 mt-2 prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h3 className="text-sm font-semibold text-sidebar-foreground mt-3 mb-1">{children}</h3>,
                      h2: ({ children }) => <h4 className="text-sm font-semibold text-sidebar-foreground mt-3 mb-1">{children}</h4>,
                      h3: ({ children }) => <h5 className="text-sm font-medium text-sidebar-foreground mt-2 mb-1">{children}</h5>,
                      p: ({ children }) => <p className="text-sm text-sidebar-foreground/80 leading-relaxed mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm text-sidebar-foreground/80 list-disc list-inside space-y-1 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="text-sm text-sidebar-foreground/80 list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      code: ({ children }) => <code className="text-xs bg-sidebar-accent px-1 py-0.5 rounded font-mono">{children}</code>,
                      strong: ({ children }) => <strong className="font-semibold text-sidebar-foreground">{children}</strong>,
                    }}
                  >
                    {response.explanation}
                  </ReactMarkdown>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Patterns Detected */}
          {response.patterns_detected && response.patterns_detected.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-sidebar-foreground/60" />
                <span className="text-sm font-medium text-sidebar-foreground">
                  Patterns Detected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {response.patterns_detected.map((pattern, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {pattern}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Learning Path */}
          {response.learning_path && response.learning_path.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-sidebar-foreground/60" />
                <span className="text-sm font-medium text-sidebar-foreground">
                  Suggested Learning Path
                </span>
              </div>
              <p className="text-xs text-sidebar-foreground/60">
                Follow these files in order to understand the concept:
              </p>
              <div className="space-y-2">
                {response.learning_path.map((step: LearningPathStep) => (
                  <button
                    key={step.step}
                    onClick={() => handleFileClick(step.file_path)}
                    className="flex w-full items-start gap-3 rounded-lg p-3 hover:bg-sidebar-accent transition-colors text-left border border-sidebar-border"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium shrink-0">
                      {step.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {step.file_path.split('/').pop()}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 line-clamp-2">
                        {step.reason}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sidebar-foreground/40 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related Files */}
          {response.files && response.files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-sidebar-foreground/60" />
                <span className="text-sm font-medium text-sidebar-foreground">
                  Relevant Files ({response.files.length})
                </span>
              </div>
              <div className="space-y-2">
                {response.files.map((file: FileReference, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleFileClick(file.file_path)}
                    className="w-full text-left rounded-lg border border-sidebar-border p-3 hover:bg-sidebar-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {file.file_path.split('/').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.file_path}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {file.role}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-sidebar-primary font-medium shrink-0">What:</span>
                        <p className="text-xs text-sidebar-foreground/80">{file.what_it_does}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-accent-foreground font-medium shrink-0">Why:</span>
                        <p className="text-xs text-sidebar-foreground/80">{file.why_important}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No files found */}
          {(!response.files || response.files.length === 0) && 
           (!response.learning_path || response.learning_path.length === 0) && (
            <div className="text-center py-4">
              <p className="text-sm text-sidebar-foreground/60">
                No specific files identified. Try analyzing more files to improve results.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
