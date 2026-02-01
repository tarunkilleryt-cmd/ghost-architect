import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  FolderTree, 
  Github, 
  ChevronUp,
  Loader2,
  Save,
  History,
  Upload,
  FolderOpen,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ParsedFile, detectLanguage } from '@/lib/structureParser';

interface AnalyzePanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze: (input: string, projectName: string) => Promise<void>;
  onAnalyzeFiles: (files: ParsedFile[], projectName: string) => Promise<void>;
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

const CODE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cs', 'go', 'rs', 'cpp', 'c', 'h', 'hpp', 'rb', 'php', 'swift', 'kt', 'scala', 'vue', 'svelte'];

export function AnalyzePanel({
  isOpen,
  onOpenChange,
  onAnalyze,
  onAnalyzeFiles,
  onSave,
  onLoadProject,
  savedProjects,
  isAnalyzing,
  isLoading,
  currentProjectName,
  onProjectNameChange,
}: AnalyzePanelProps) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'text' | 'github' | 'drop'>('text');
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<ParsedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process file entries from drag/drop or file input
  const processFileEntry = async (entry: FileSystemEntry, basePath = ''): Promise<ParsedFile[]> => {
    const files: ParsedFile[] = [];

    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });

      const path = basePath ? `${basePath}/${entry.name}` : entry.name;
      const dotIndex = entry.name.lastIndexOf('.');
      
      if (dotIndex > 0) {
        const extension = entry.name.slice(dotIndex + 1).toLowerCase();
        if (CODE_EXTENSIONS.includes(extension)) {
          files.push({
            path,
            name: entry.name,
            extension,
            language: detectLanguage(extension),
          });
        }
      }
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        const allEntries: FileSystemEntry[] = [];
        const readEntries = () => {
          reader.readEntries((results) => {
            if (results.length === 0) {
              resolve(allEntries);
            } else {
              allEntries.push(...results);
              readEntries();
            }
          }, reject);
        };
        readEntries();
      });

      const newBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      for (const childEntry of entries) {
        const childFiles = await processFileEntry(childEntry, newBasePath);
        files.push(...childFiles);
      }
    }

    return files;
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setInputType('drop');

    const items = e.dataTransfer.items;
    const allFiles: ParsedFile[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          const files = await processFileEntry(entry);
          allFiles.push(...files);
        }
      }
    }

    if (allFiles.length === 0) {
      // Try regular file list as fallback
      const fileList = e.dataTransfer.files;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const dotIndex = file.name.lastIndexOf('.');
        if (dotIndex > 0) {
          const extension = file.name.slice(dotIndex + 1).toLowerCase();
          if (CODE_EXTENSIONS.includes(extension)) {
            // Try to get path from webkitRelativePath
            const path = (file as any).webkitRelativePath || file.name;
            allFiles.push({
              path,
              name: file.name,
              extension,
              language: detectLanguage(extension),
            });
          }
        }
      }
    }

    setDroppedFiles(allFiles);
    
    // Extract project name from first directory
    if (allFiles.length > 0) {
      const firstPath = allFiles[0].path;
      const parts = firstPath.split('/');
      if (parts.length > 1) {
        onProjectNameChange(parts[0]);
      }
    }
  }, [onProjectNameChange]);

  // Handle file input change
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setInputType('drop');
    const allFiles: ParsedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dotIndex = file.name.lastIndexOf('.');
      
      if (dotIndex > 0) {
        const extension = file.name.slice(dotIndex + 1).toLowerCase();
        if (CODE_EXTENSIONS.includes(extension)) {
          const path = (file as any).webkitRelativePath || file.name;
          allFiles.push({
            path,
            name: file.name,
            extension,
            language: detectLanguage(extension),
          });
        }
      }
    }

    setDroppedFiles(allFiles);

    // Extract project name
    if (allFiles.length > 0 && (files[0] as any).webkitRelativePath) {
      const firstPath = (files[0] as any).webkitRelativePath;
      const parts = firstPath.split('/');
      if (parts.length > 1) {
        onProjectNameChange(parts[0]);
      }
    }
  }, [onProjectNameChange]);

  const handleAnalyze = async () => {
    if (inputType === 'drop' && droppedFiles.length > 0) {
      await onAnalyzeFiles(droppedFiles, currentProjectName);
      onOpenChange(false);
      setDroppedFiles([]);
    } else if (input.trim()) {
      await onAnalyze(input, currentProjectName);
      onOpenChange(false);
    }
  };

  const loadExample = () => {
    setInput(EXAMPLE_STRUCTURE);
    setInputType('text');
    setDroppedFiles([]);
  };

  const clearDroppedFiles = () => {
    setDroppedFiles([]);
    setInputType('text');
  };

  const canAnalyze = (inputType === 'drop' && droppedFiles.length > 0) || 
                     (inputType !== 'drop' && input.trim());

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Panel */}
      <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 w-full max-w-2xl px-4">
        <Card className="bg-background border-border shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">Input Project</span>
            </div>

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

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-3 pb-3 pt-1 space-y-3">
              {/* Input Type Toggle */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={inputType === 'drop' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setInputType('drop')}
                  className="gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Drop Folder
                </Button>
                <Button
                  variant={inputType === 'text' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setInputType('text'); setDroppedFiles([]); }}
                  className="gap-1"
                >
                  <FolderTree className="h-3 w-3" />
                  Paste Structure
                </Button>
                <Button
                  variant={inputType === 'github' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setInputType('github'); setDroppedFiles([]); }}
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

              {/* Drop Zone */}
              {inputType === 'drop' && (
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 transition-colors",
                    isDragging 
                      ? "border-primary bg-primary/5" 
                      : "border-muted-foreground/30 hover:border-primary/50",
                    droppedFiles.length > 0 && "border-primary/50 bg-primary/5"
                  )}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    // @ts-ignore - webkitdirectory is not in types
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFileInputChange}
                  />
                  
                  {droppedFiles.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <FolderOpen className="h-4 w-4" />
                          {droppedFiles.length} code files detected
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearDroppedFiles}
                          className="text-xs h-7"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-0.5 font-mono">
                        {droppedFiles.slice(0, 15).map((f, i) => (
                          <div key={i} className="truncate">
                            {f.path}
                          </div>
                        ))}
                        {droppedFiles.length > 15 && (
                          <div className="text-primary">
                            ... and {droppedFiles.length - 15} more files
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className={cn(
                        "h-8 w-8 mx-auto transition-colors",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="text-sm">
                        <span className="font-medium">Drop a folder here</span>
                        <span className="text-muted-foreground"> or </span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="font-medium text-primary hover:underline"
                        >
                          browse
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only code files will be analyzed (.ts, .tsx, .js, .py, etc.)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Text Input */}
              {inputType === 'text' && (
                <Textarea
                  placeholder={`Paste your folder structure here...\n\nExample:\nsrc/\n├── App.tsx\n├── components/\n│   └── Button.tsx\n└── utils/\n    └── helpers.ts`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[150px] font-mono text-xs leading-relaxed resize-y"
                />
              )}

              {/* GitHub Input */}
              {inputType === 'github' && (
                <Input
                  placeholder="https://github.com/username/repository"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="font-mono text-sm"
                />
              )}

              {/* Help Text */}
              <p className="text-xs text-muted-foreground">
                {inputType === 'github' 
                  ? 'Enter a public GitHub repository URL to analyze its structure.'
                  : inputType === 'drop'
                  ? 'Drop a folder from your computer. We only read file names and paths—no content is uploaded.'
                  : 'Paste a folder tree (from `tree` command or IDE) to generate a visual architecture map.'
                }
              </p>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
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
          </Card>
        </div>
      </>
    );
  }
