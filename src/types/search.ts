// Types for AI Search responses

export interface FileReference {
  file_path: string;
  file_id: string;
  role: string;
  what_it_does: string;
  why_important: string;
}

export interface LearningPathStep {
  step: number;
  file_path: string;
  file_id: string;
  reason: string;
}

export interface SearchResponse {
  answer: string;
  explanation: string;
  files: FileReference[];
  learning_path?: LearningPathStep[];
  patterns_detected?: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  error?: string;
}

// Legacy format for backwards compatibility
export interface LegacySearchResult {
  file_path: string;
  file_id: string;
  relevance: number;
  reason: string;
  concepts: string[];
}
