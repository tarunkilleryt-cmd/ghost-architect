import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  FolderGit2, 
  FileCode, 
  Lightbulb, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  BookMarked,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileDropdown } from '@/components/profile/ProfileDropdown';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { stats, recentActivity, isLoading, refresh } = useDashboardStats();
  const navigate = useNavigate();

  const totalLearning = stats.learningProgress.understood + 
                        stats.learningProgress.inProgress + 
                        stats.learningProgress.needReview;
  
  const progressPercentage = totalLearning > 0 
    ? Math.round((stats.learningProgress.understood / totalLearning) * 100) 
    : 0;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderGit2 className="h-4 w-4 text-primary" />;
      case 'analysis': return <FileCode className="h-4 w-4 text-primary/70" />;
      case 'learning': return <BookOpen className="h-4 w-4 text-primary/50" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ghost Architect
            </h1>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Graph View
              </Button>
              <Button variant="ghost" size="sm" className="bg-accent">
                Dashboard
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your codebase exploration and learning progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Repositories analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Analyzed</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalFilesAnalyzed}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Code files with AI insights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concepts Learned</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalConcepts}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Deep-dive explanations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{progressPercentage}%</div>
              )}
              <p className="text-xs text-muted-foreground">
                Files marked as understood
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Learning Progress Details */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5" />
                Learning Progress
              </CardTitle>
              <CardDescription>
                Track your understanding of the codebase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Understood
                      </span>
                      <span className="font-medium">{stats.learningProgress.understood}</span>
                    </div>
                    <Progress value={totalLearning > 0 ? (stats.learningProgress.understood / totalLearning) * 100 : 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary/70" />
                        Studying
                      </span>
                      <span className="font-medium">{stats.learningProgress.inProgress}</span>
                    </div>
                    <Progress value={totalLearning > 0 ? (stats.learningProgress.inProgress / totalLearning) * 100 : 0} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Need Review
                      </span>
                      <span className="font-medium">{stats.learningProgress.needReview}</span>
                    </div>
                    <Progress value={totalLearning > 0 ? (stats.learningProgress.needReview / totalLearning) * 100 : 0} className="h-2" />
                  </div>

                  {totalLearning === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        No learning progress yet. Start by analyzing a project!
                      </p>
                      <Button onClick={() => navigate('/')} size="sm">
                        Go to Graph View
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest actions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    No recent activity. Start exploring codebases!
                  </p>
                  <Button onClick={() => navigate('/')} size="sm">
                    Analyze a Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/')} variant="outline">
                <FolderGit2 className="mr-2 h-4 w-4" />
                Analyze New Project
              </Button>
              <Button onClick={() => navigate('/profile')} variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
