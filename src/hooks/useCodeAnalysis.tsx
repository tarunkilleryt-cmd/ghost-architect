import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Concept {
  name: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
}

interface AIAnalysis {
  summary: string;
  concepts: Concept[];
  patterns: string[];
  importanceScore: number;
  category: string;
}

interface AnalysisResult {
  success: boolean;
  analysis: AIAnalysis;
  fileId: string;
}

export function useCodeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const getStoredAnalysis = useCallback(async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .from('code_analysis')
        .select(`
          *,
          code_knowledge (*)
        `)
        .eq('file_path', filePath)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Failed to get stored analysis:', err);
      return null;
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

  const getLearningProgress = useCallback(async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('file_id', fileId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Failed to get learning progress:', err);
      return null;
    }
  }, []);

  return {
    analyzeFile,
    getStoredAnalysis,
    updateLearningProgress,
    getLearningProgress,
    isAnalyzing,
    error
  };
}
