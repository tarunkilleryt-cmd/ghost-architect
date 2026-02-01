import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Concept {
  id: string;
  concept_name: string;
  content_markdown: string;
  difficulty_level: 'beginner' | 'intermediate' | 'expert';
}

interface CodeAnalysisData {
  id: string;
  file_path: string;
  ai_summary: string | null;
  importance_score: number | null;
  category: string | null;
  language: string | null;
  code_knowledge: Concept[];
}

interface AIAnalysis {
  summary: string;
  concepts: {
    name: string;
    explanation: string;
    difficulty: 'beginner' | 'intermediate' | 'expert';
  }[];
  patterns: string[];
  importanceScore: number;
  category: string;
}

interface AnalysisResult {
  success: boolean;
  analysis: AIAnalysis;
  fileId: string;
}

interface LearningProgress {
  id: string;
  file_id: string;
  status: 'understood' | 'need_review' | 'in_progress';
  notes: string | null;
}

export interface SearchResult {
  file_path: string;
  file_id: string;
  relevance: number;
  reason: string;
  concepts: string[];
}

export function useCodeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeFile = useCallback(async (
    fileContent: string,
    filePath: string,
    fileName: string,
    language: string
  ): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to analyze code');
      }

      const { data, error: fnError } = await supabase.functions.invoke('analyze-code', {
        body: {
          fileContent,
          filePath,
          fileName,
          language
        }
      });

      if (fnError) {
        throw fnError;
      }

      toast({
        title: 'Analysis Complete',
        description: `Successfully analyzed ${fileName}`,
      });

      return data as AnalysisResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const getStoredAnalysis = useCallback(async (filePath: string): Promise<CodeAnalysisData | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('code_analysis')
        .select(`
          id,
          file_path,
          ai_summary,
          importance_score,
          category,
          language,
          code_knowledge (
            id,
            concept_name,
            content_markdown,
            difficulty_level
          )
        `)
        .eq('file_path', filePath)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as CodeAnalysisData | null;
    } catch (err) {
      console.error('Failed to get stored analysis:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getKnowledgeByFileId = useCallback(async (fileId: string): Promise<Concept[]> => {
    try {
      const { data, error } = await supabase
        .from('code_knowledge')
        .select('*')
        .eq('file_id', fileId);

      if (error) {
        throw error;
      }

      return (data || []) as Concept[];
    } catch (err) {
      console.error('Failed to get knowledge:', err);
      return [];
    }
  }, []);

  const updateLearningProgress = useCallback(async (
    fileId: string,
    status: 'understood' | 'need_review' | 'in_progress',
    notes?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          file_id: fileId,
          status,
          notes
        }, {
          onConflict: 'user_id,file_id'
        });

      if (error) throw error;

      toast({
        title: 'Progress Updated',
        description: `Marked as ${status.replace('_', ' ')}`,
      });
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }, [toast]);

  const getLearningProgress = useCallback(async (fileId: string): Promise<LearningProgress | null> => {
    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('file_id', fileId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as LearningProgress | null;
    } catch (err) {
      console.error('Failed to get learning progress:', err);
      return null;
    }
  }, []);

  const searchKnowledge = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to search');
      }

      const { data, error: fnError } = await supabase.functions.invoke('search-knowledge', {
        body: { query }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: 'Rate Limited',
            description: 'Too many requests. Please wait a moment.',
            variant: 'destructive',
          });
        }
        throw new Error(data.error);
      }

      return data.results || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      console.error('Search failed:', message);
      toast({
        title: 'Search Failed',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  return {
    analyzeFile,
    getStoredAnalysis,
    getKnowledgeByFileId,
    updateLearningProgress,
    getLearningProgress,
    searchKnowledge,
    isAnalyzing,
    isLoading,
    isSearching,
    error
  };
}
