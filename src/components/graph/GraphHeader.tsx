import { Search, Filter, Download, Sun, Moon, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProfileDropdown } from '@/components/profile/ProfileDropdown';
import { useState, useEffect } from 'react';

interface GraphHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    typescript: boolean;
    javascript: boolean;
    core: boolean;
    utility: boolean;
    interface: boolean;
    configuration: boolean;
  };
  onFilterChange: (key: string, value: boolean) => void;
  onOpenAnalyze: () => void;
  onOpenProjectsSidebar: () => void;
}

export function GraphHeader({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onOpenAnalyze,
  onOpenProjectsSidebar,
}: GraphHeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu for Projects */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onOpenProjectsSidebar}
          className="mr-1"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Ghost Architect</h1>
            <p className="text-xs text-muted-foreground">Codebase Visualizer</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Input Project Button */}
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => {
            console.log('Input button clicked');
            onOpenAnalyze();
          }}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Input
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-9"
          />
        </div>

        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>File Types</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.typescript}
              onCheckedChange={(v) => onFilterChange('typescript', v)}
            >
              TypeScript
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.javascript}
              onCheckedChange={(v) => onFilterChange('javascript', v)}
            >
              JavaScript
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Categories</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.core}
              onCheckedChange={(v) => onFilterChange('core', v)}
            >
              Core
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.utility}
              onCheckedChange={(v) => onFilterChange('utility', v)}
            >
              Utility
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.interface}
              onCheckedChange={(v) => onFilterChange('interface', v)}
            >
              Interface
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.configuration}
              onCheckedChange={(v) => onFilterChange('configuration', v)}
            >
              Configuration
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button variant="outline" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
