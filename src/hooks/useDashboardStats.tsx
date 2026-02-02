import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalProjects: number;
  totalFilesAnalyzed: number;
  totalConcepts: number;
  learningProgress: {
    understood: number;
    inProgress: number;
    needReview: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'analysis' | 'project' | 'learning';
  title: string;
  description: string;
  timestamp: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalFilesAnalyzed: 0,
    totalConcepts: 0,
    learningProgress: {
      understood: 0,
      inProgress: 0,
      needReview: 0,
    },
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all stats in parallel
      const [projectsRes, analysisRes, knowledgeRes, progressRes] = await Promise.all([
        supabase.from('projects').select('id, name, created_at', { count: 'exact' }),
        supabase.from('code_analysis').select('id, file_path, created_at, updated_at', { count: 'exact' }),
        supabase.from('code_knowledge').select('id', { count: 'exact' }),
        supabase.from('learning_progress').select('id, status, file_id, updated_at'),
      ]);

      // Calculate learning progress
      const progressData = progressRes.data || [];
      const learningProgress = {
        understood: progressData.filter(p => p.status === 'understood').length,
        inProgress: progressData.filter(p => p.status === 'in_progress').length,
        needReview: progressData.filter(p => p.status === 'need_review').length,
      };

      setStats({
        totalProjects: projectsRes.count || 0,
        totalFilesAnalyzed: analysisRes.count || 0,
        totalConcepts: knowledgeRes.count || 0,
        learningProgress,
      });

      // Build recent activity from all sources
      const activities: RecentActivity[] = [];

      // Add recent projects
      (projectsRes.data || []).slice(0, 5).forEach(project => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          title: `Created project: ${project.name}`,
          description: 'New project added',
          timestamp: project.created_at,
        });
      });

      // Add recent analyses
      (analysisRes.data || []).slice(0, 5).forEach(analysis => {
        activities.push({
          id: `analysis-${analysis.id}`,
          type: 'analysis',
          title: `Analyzed: ${analysis.file_path.split('/').pop()}`,
          description: analysis.file_path,
          timestamp: analysis.updated_at || analysis.created_at,
        });
      });

      // Add recent learning progress updates
      (progressRes.data || []).slice(0, 5).forEach(progress => {
        const statusLabels = {
          understood: 'Marked as understood',
          in_progress: 'Started studying',
          need_review: 'Marked for review',
        };
        activities.push({
          id: `learning-${progress.id}`,
          type: 'learning',
          title: statusLabels[progress.status as keyof typeof statusLabels] || 'Updated progress',
          description: `File learning status updated`,
          timestamp: progress.updated_at,
        });
      });

      // Sort by timestamp and take most recent 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    recentActivity,
    isLoading,
    refresh: fetchStats,
  };
}
