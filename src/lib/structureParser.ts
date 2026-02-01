// Structure parser for GitHub URLs and folder structure text
import { FileNode, DependencyEdge, Language, NodeCategory, ImportanceLevel } from '@/types/graph';

export interface ParsedFile {
  path: string;
  name: string;
  extension: string;
  language: Language;
}

export interface ParsedStructure {
  files: ParsedFile[];
  projectName: string;
  source: 'github' | 'text' | 'unknown';
}

// Detect language from file extension
export function detectLanguage(extension: string): Language {
  const langMap: Record<string, Language> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cs: 'csharp',
  };
  return langMap[extension.toLowerCase()] || 'unknown';
}

// Parse a GitHub URL
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /github\.com:([^\/]+)\/([^\/]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace('.git', ''),
      };
    }
  }
  return null;
}

// Check if input is a GitHub URL
export function isGitHubUrl(input: string): boolean {
  return input.includes('github.com');
}

// Parse folder structure text (tree-like format)
export function parseTextStructure(text: string): ParsedStructure {
  const lines = text.split('\n').filter(line => line.trim());
  const files: ParsedFile[] = [];
  let projectName = 'Untitled Project';
  
  // Common code file extensions
  const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cs', 'go', 'rs', 'cpp', 'c', 'h', 'hpp', 'rb', 'php', 'swift', 'kt', 'scala'];
  
  for (const line of lines) {
    // Clean up tree characters and extract path
    let path = line
      .replace(/^[\s│├└─┬┴┼┐┘┌└]*/, '')
      .replace(/^[│├└─\s\|\\\/\-\+]*/, '')
      .trim();
    
    // Skip empty lines and common non-file entries
    if (!path || path === '.' || path === '..') continue;
    
    // Extract project name from root folder
    if (lines.indexOf(line) === 0 && !path.includes('.')) {
      projectName = path.replace(/[\/\\]$/, '');
      continue;
    }
    
    // Check if this is a file (has extension)
    const lastPart = path.split(/[\/\\]/).pop() || '';
    const dotIndex = lastPart.lastIndexOf('.');
    
    if (dotIndex > 0) {
      const extension = lastPart.slice(dotIndex + 1).toLowerCase();
      
      // Only include code files
      if (codeExtensions.includes(extension)) {
        files.push({
          path,
          name: lastPart,
          extension,
          language: detectLanguage(extension),
        });
      }
    }
  }
  
  return {
    files,
    projectName,
    source: 'text',
  };
}

// Detect category based on path and filename
function detectCategory(path: string, name: string): NodeCategory {
  const pathLower = path.toLowerCase();
  const nameLower = name.toLowerCase();
  
  if (pathLower.includes('config') || nameLower.includes('config') || 
      nameLower.includes('.json') || nameLower.includes('.yaml') ||
      nameLower.includes('.toml') || nameLower.includes('.env')) {
    return 'configuration';
  }
  
  if (pathLower.includes('type') || pathLower.includes('interface') ||
      nameLower.includes('.d.ts')) {
    return 'interface';
  }
  
  if (pathLower.includes('util') || pathLower.includes('helper') ||
      pathLower.includes('hook') || pathLower.includes('lib')) {
    return 'utility';
  }
  
  if (pathLower.includes('component') || pathLower.includes('page') ||
      pathLower.includes('app') || pathLower.includes('index') ||
      pathLower.includes('main') || pathLower.includes('store') ||
      pathLower.includes('service') || pathLower.includes('api')) {
    return 'core';
  }
  
  return 'utility';
}

// Calculate importance level from score
function getImportanceLevel(score: number): ImportanceLevel {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

// Calculate initial importance based on file characteristics
function calculateInitialImportance(path: string, name: string): number {
  let score = 0.3; // Base score
  
  const pathLower = path.toLowerCase();
  const nameLower = name.toLowerCase();
  
  // Entry points are most important
  if (nameLower.includes('index') || nameLower.includes('main') || 
      nameLower.includes('app.')) {
    score += 0.4;
  }
  
  // Core files
  if (pathLower.includes('store') || pathLower.includes('router') ||
      pathLower.includes('context') || pathLower.includes('provider')) {
    score += 0.3;
  }
  
  // Service/API files
  if (pathLower.includes('service') || pathLower.includes('api')) {
    score += 0.25;
  }
  
  // Pages/Components
  if (pathLower.includes('page') || pathLower.includes('component')) {
    score += 0.15;
  }
  
  // Hooks
  if (pathLower.includes('hook') || nameLower.startsWith('use')) {
    score += 0.2;
  }
  
  // Config files less important
  if (pathLower.includes('config') || pathLower.includes('test') ||
      pathLower.includes('spec') || pathLower.includes('.test.')) {
    score -= 0.1;
  }
  
  return Math.min(1, Math.max(0.1, score));
}

// Generate node positions using a force-directed-like algorithm
function generatePositions(files: ParsedFile[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Group files by directory
  const directories = new Map<string, ParsedFile[]>();
  
  for (const file of files) {
    const parts = file.path.split(/[\/\\]/);
    const dir = parts.slice(0, -1).join('/') || 'root';
    
    if (!directories.has(dir)) {
      directories.set(dir, []);
    }
    directories.get(dir)!.push(file);
  }
  
  // Position directories in a grid
  const dirArray = Array.from(directories.entries());
  const cols = Math.ceil(Math.sqrt(dirArray.length));
  const dirSpacing = 250;
  const fileSpacing = 80;
  
  dirArray.forEach(([dir, dirFiles], dirIndex) => {
    const col = dirIndex % cols;
    const row = Math.floor(dirIndex / cols);
    const baseX = col * dirSpacing + 100;
    const baseY = row * dirSpacing + 50;
    
    // Position files within directory
    const fileCols = Math.ceil(Math.sqrt(dirFiles.length));
    dirFiles.forEach((file, fileIndex) => {
      const fileCol = fileIndex % fileCols;
      const fileRow = Math.floor(fileIndex / fileCols);
      
      positions.set(file.path, {
        x: baseX + fileCol * fileSpacing,
        y: baseY + fileRow * fileSpacing,
      });
    });
  });
  
  return positions;
}

// Convert parsed files to graph nodes
export function filesToNodes(files: ParsedFile[]): FileNode[] {
  const positions = generatePositions(files);
  
  return files.map((file, index) => {
    const importance = calculateInitialImportance(file.path, file.name);
    const category = detectCategory(file.path, file.name);
    const pos = positions.get(file.path) || { x: (index % 8) * 100, y: Math.floor(index / 8) * 120 };
    
    return {
      id: file.path.replace(/[\/\\.]/g, '_'),
      path: file.path,
      name: file.name,
      language: file.language,
      size: 0,
      complexity: 0,
      importance,
      importanceLevel: getImportanceLevel(importance),
      category,
      functions: [],
      classes: [],
      dependencies: [],
      dependents: [],
      x: pos.x,
      y: pos.y,
    };
  });
}

// Generate edges based on directory relationships and naming conventions
export function generateEdges(nodes: FileNode[]): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Find potential connections based on naming and structure
  for (const node of nodes) {
    const nodeName = node.name.toLowerCase().replace(/\.[^.]+$/, '');
    const nodeDir = node.path.split(/[\/\\]/).slice(0, -1).join('/');
    
    for (const other of nodes) {
      if (node.id === other.id) continue;
      
      const otherName = other.name.toLowerCase().replace(/\.[^.]+$/, '');
      const otherDir = other.path.split(/[\/\\]/).slice(0, -1).join('/');
      
      // Index files import from same directory
      if (nodeName === 'index' && nodeDir === otherDir) {
        edges.push({
          id: `${node.id}-${other.id}`,
          source: node.id,
          target: other.id,
          type: 'import',
          strength: 0.8,
        });
      }
      
      // Hook used by component with similar name
      if (nodeName.startsWith('use') && otherName.includes(nodeName.replace('use', '').toLowerCase())) {
        edges.push({
          id: `${other.id}-${node.id}`,
          source: other.id,
          target: node.id,
          type: 'import',
          strength: 0.7,
        });
      }
      
      // App/Main imports routers, stores
      if ((nodeName === 'app' || nodeName === 'main') && 
          (otherName.includes('router') || otherName.includes('store') || otherName.includes('provider'))) {
        edges.push({
          id: `${node.id}-${other.id}`,
          source: node.id,
          target: other.id,
          type: 'import',
          strength: 0.9,
        });
      }
    }
  }
  
  return edges;
}

// Validate and parse input
export function parseInput(input: string): ParsedStructure {
  const trimmed = input.trim();
  
  if (isGitHubUrl(trimmed)) {
    const parsed = parseGitHubUrl(trimmed);
    if (parsed) {
      return {
        files: [],
        projectName: parsed.repo,
        source: 'github',
      };
    }
  }
  
  return parseTextStructure(trimmed);
}
