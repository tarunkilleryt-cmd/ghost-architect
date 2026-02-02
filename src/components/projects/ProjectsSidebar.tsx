import { FolderOpen, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FileNode, DependencyEdge } from '@/types/graph';

interface ProjectData {
  id: string;
  name: string;
  nodes: FileNode[];
  edges: DependencyEdge[];
  createdAt: string;
}

interface ProjectsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  currentProjectName: string;
  onLoadProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject?: (id: string) => void;
}

export function ProjectsSidebar({
  isOpen,
  onClose,
  projects,
  currentProjectName,
  onLoadProject,
  onNewProject,
  onDeleteProject,
}: ProjectsSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50",
        "transform transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">My Projects</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Project Button */}
        <div className="p-3 border-b border-border">
          <Button 
            variant="default" 
            className="w-full gap-2"
            onClick={() => {
              onNewProject();
              onClose();
            }}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Projects List */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div className="p-2">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No saved projects yet</p>
                <p className="text-xs mt-1">Input a project to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-lg cursor-pointer",
                      "hover:bg-accent/50 transition-colors",
                      currentProjectName === project.name && "bg-accent"
                    )}
                    onClick={() => {
                      onLoadProject(project.id);
                      onClose();
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.nodes.length} files • {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {onDeleteProject && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
