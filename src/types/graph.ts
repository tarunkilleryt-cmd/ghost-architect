// Core data types for Ghost Architect graph visualization

export type Language = 'typescript' | 'javascript' | 'python' | 'java' | 'csharp' | 'unknown';
export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';
export type EdgeType = 'import' | 'inheritance' | 'composition' | 'call';
export type NodeCategory = 'core' | 'utility' | 'interface' | 'configuration';

export interface FunctionInfo {
  name: string;
  lineStart: number;
  lineEnd: number;
  complexity: number;
  parameters: string[];
}

export interface ClassInfo {
  name: string;
  lineStart: number;
  lineEnd: number;
  methods: string[];
  properties: string[];
}

export interface FileNode {
  id: string;
  path: string;
  name: string;
  language: Language;
  size: number;
  complexity: number;
  importance: number;
  importanceLevel: ImportanceLevel;
  category: NodeCategory;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  dependencies: string[];
  dependents: string[];
  // Visual positioning
  x: number;
  y: number;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  strength: number;
}

export interface ImportanceAnalysis {
  score: number;
  factors: {
    name: string;
    value: number;
    weight: number;
  }[];
  reasoning: string;
  category: NodeCategory;
}

export interface AIExplanation {
  component: string;
  summary: string;
  details: string[];
  patterns: string[];
  suggestions: string[];
  confidence: number;
}

export interface LearningPath {
  steps: {
    fileId: string;
    order: number;
    reason: string;
  }[];
  totalEstimatedTime: number;
}

export interface GraphFilter {
  fileTypes?: Language[];
  importanceRange?: [number, number];
  directories?: string[];
  searchQuery?: string;
}

export interface GraphState {
  nodes: FileNode[];
  edges: DependencyEdge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  filter: GraphFilter;
  zoom: number;
  pan: { x: number; y: number };
}
