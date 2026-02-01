import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  Upload, 
  FolderTree, 
  Github, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Save,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface AnalyzePanelProps {
  onAnalyze: (input: string, projectName: string) => Promise<void>;
  onSave: () => Promise<void>;
  onLoadProject: (projectId: string) => Promise<void>;
  savedProjects: Array<{ id: string; name: string; createdAt: string }>;
  isAnalyzing: boolean;
  isLoading: boolean;
  currentProjectName: string;
  onProjectNameChange: (name: string) => void;
}

const EXAMPLE_STRUCTURE = `my-react-app/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Button.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   └── Dashboard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useData.ts
│   ├── store/
│   │   ├── index.ts
│   │   └── userSlice.ts
│   └── utils/
│       └── helpers.ts
├── package.json
└── tsconfig.json`;

export function AnalyzePanel({
  onAnalyze,
  onSave,
  onLoadProject,
  savedProjects,
  isAnalyzing,
  isLoading,
  currentProjectName,
  onProjectNameChange,
}: AnalyzePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'text' | 'github'>('text');

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    await onAnalyze(input, currentProjectName);
    setIsOpen(false);
  };

  const loadExample = () => {
    setInput(EXAMPLE_STRUCTURE);
    setInputType('text');
  };

  return (
    <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 w-full max-w-2xl px-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-background/95 backdrop-blur-sm border-border shadow-lg">
          {/* Collapsed Header */}
          <div className="flex items-center gap-2 p-3">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2 flex-1 justify-start"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">Analyze Codebase</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </Button>
            </CollapsibleTrigger>

            {/* Project Name */}
            <Input
              value={currentProjectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              className="w-40 h-8 text-sm"
              placeholder="Project name"
            />

            {/* Save Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Save
            </Button>

            {/* Load Projects Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <History className="h-3 w-3" />
                  History
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {savedProjects.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No saved projects
                  </DropdownMenuItem>
                ) : (
                  savedProjects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => onLoadProject(project.id)}
                    >
                      <FolderTree className="h-4 w-4 mr-2" />
                      <span className="truncate">{project.name}</span>
                    </DropdownMenuItem>
                  ))
                )}
                {savedProjects.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs text-muted-foreground">
                      {savedProjects.length} project{savedProjects.length > 1 ? 's' : ''} saved
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
              {/* Input Type Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={inputType === 'text' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setInputType('text')}
                  className="gap-1"
                >
                  <FolderTree className="h-3 w-3" />
                  Folder Structure
                </Button>
                <Button
                  variant={inputType === 'github' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setInputType('github')}
                  className="gap-1"
                >
                  <Github className="h-3 w-3" />
                  GitHub URL
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadExample}
                  className="ml-auto text-xs text-muted-foreground"
                >
                  Load Example
                </Button>
              </div>

              {/* Input Field */}
              {inputType === 'github' ? (
                <Input
                  placeholder="https://github.com/username/repository"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="font-mono text-sm"
                />
              ) : (
                <Textarea
                  placeholder={`Paste your folder structure here...\n\nExample:\nsrc/\n├── App.tsx\n├── components/\n│   └── Button.tsx\n└── utils/\n    └── helpers.ts`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[150px] font-mono text-xs leading-relaxed resize-y"
                />
              )}

              {/* Help Text */}
              <p className="text-xs text-muted-foreground">
                {inputType === 'github' 
                  ? 'Enter a public GitHub repository URL to analyze its structure.'
                  : 'Paste a folder tree (from `tree` command or IDE) to generate a visual architecture map.'
                }
              </p>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!input.trim() || isAnalyzing}
                className="w-full gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Structure...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze & Generate Map
                  </>
                )}
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
