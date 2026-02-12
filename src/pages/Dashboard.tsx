import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ResumeUploader } from '@/components/dashboard/ResumeUploader';
import { SkillGapAnalysis } from '@/components/dashboard/SkillGapAnalysis';
import { JobCard } from '@/components/jobs/JobCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Briefcase, 
  BookOpen, 
  TrendingUp, 
  Loader2,
  ExternalLink,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface Resume {
  id: string;
  file_name: string;
  extracted_skills: string[] | null;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  required_skills: string[];
  salary_min?: number;
  salary_max?: number;
  is_internship: boolean;
  created_at: string;
}

interface LearningResource {
  id: string;
  skill_name: string;
  resource_title: string;
  resource_url: string;
  resource_type: string;
  provider: string | null;
  is_free: boolean;
}

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [matchedJobs, setMatchedJobs] = useState<(Job & { compatibility_score: number; matched_skills: string[]; missing_skills: string[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch resumes
      const { data: resumeData } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resumeData) {
        setResumes(resumeData);
        if (resumeData.length > 0) {
          setSelectedResume(resumeData[0]);
        }
      }

      // Fetch jobs
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (jobData) {
        setJobs(jobData);
      }

      // Fetch applications
      const { data: appData } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('user_id', user.id);

      if (appData) {
        setApplications(appData.map((a) => a.job_id));
      }

      // Fetch learning resources
      const { data: resourceData } = await supabase
        .from('learning_resources')
        .select('*')
        .limit(12);

      if (resourceData) {
        setLearningResources(resourceData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedResume?.extracted_skills && jobs.length > 0) {
      calculateMatches();
    }
  }, [selectedResume, jobs]);

  const calculateMatches = () => {
    if (!selectedResume?.extracted_skills) return;

    const userSkills = selectedResume.extracted_skills.map((s) => s.toLowerCase());

    const jobsWithScores = jobs.map((job) => {
      const requiredSkills = job.required_skills.map((s) => s.toLowerCase());
      const matched = requiredSkills.filter((skill) => 
        userSkills.some((us) => us.includes(skill) || skill.includes(us))
      );
      const missing = requiredSkills.filter((skill) => 
        !userSkills.some((us) => us.includes(skill) || skill.includes(us))
      );
      const score = requiredSkills.length > 0 
        ? Math.round((matched.length / requiredSkills.length) * 100) 
        : 0;

      return {
        ...job,
        compatibility_score: score,
        matched_skills: job.required_skills.filter((s) => 
          matched.includes(s.toLowerCase())
        ),
        missing_skills: job.required_skills.filter((s) => 
          missing.includes(s.toLowerCase())
        ),
      };
    });

    setMatchedJobs(jobsWithScores.sort((a, b) => b.compatibility_score - a.compatibility_score));
  };

  const handleResumeUpload = (resumeId: string, extractedSkills: string[]) => {
    const newResume: Resume = {
      id: resumeId,
      file_name: 'New Resume',
      extracted_skills: extractedSkills,
      created_at: new Date().toISOString(),
    };
    setResumes([newResume, ...resumes]);
    setSelectedResume(newResume);
    fetchData();
    
    // Navigate to jobs page after successful upload
    navigate('/jobs');
  };

  const handleApply = async (jobId: string) => {
    if (!user || !selectedResume) {
      toast.error('Please upload a resume first');
      return;
    }

    try {
      const job = matchedJobs.find((j) => j.id === jobId);
      
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          resume_id: selectedResume.id,
          compatibility_score: job?.compatibility_score,
          matched_skills: job?.matched_skills,
          missing_skills: job?.missing_skills,
        });

      if (error) throw error;

      setApplications([...applications, jobId]);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already applied to this job');
      } else {
        toast.error('Failed to submit application');
      }
    }
  };

  const getMissingSkillsForLearning = () => {
    if (!matchedJobs.length) return [];
    const allMissing = matchedJobs.flatMap((j) => j.missing_skills);
    return [...new Set(allMissing)].slice(0, 5);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-1">
            Track your skill gaps and find your perfect job match
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resumes.length}</p>
                  <p className="text-sm text-muted-foreground">Resumes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Target className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedResume?.extracted_skills?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Skills Found</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/10">
                  <Briefcase className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-sm text-muted-foreground">Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {matchedJobs.filter((j) => j.compatibility_score >= 70).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Strong Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Matches</TabsTrigger>
            <TabsTrigger value="learning">Learning Path</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resume Upload */}
              <ResumeUploader onUploadComplete={handleResumeUpload} />

              {/* Skills Analysis */}
              {selectedResume?.extracted_skills && matchedJobs.length > 0 && (
                <SkillGapAnalysis
                  matchedSkills={matchedJobs[0]?.matched_skills || []}
                  missingSkills={matchedJobs[0]?.missing_skills || []}
                  compatibilityScore={matchedJobs[0]?.compatibility_score || 0}
                  jobTitle={matchedJobs[0]?.title}
                />
              )}
            </div>

            {/* Your Skills */}
            {selectedResume?.extracted_skills && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Skills</CardTitle>
                  <CardDescription>Skills extracted from your resume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.extracted_skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-accent/10 text-accent">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Job Matches */}
            {matchedJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Job Matches</CardTitle>
                  <CardDescription>Jobs that best match your skill profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchedJobs.slice(0, 4).map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        showMatchInfo
                        applied={applications.includes(job.id)}
                        onApply={handleApply}
                        onViewDetails={(id) => navigate(`/jobs/${id}`)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  showMatchInfo
                  applied={applications.includes(job.id)}
                  onApply={handleApply}
                  onViewDetails={(id) => navigate(`/jobs/${id}`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  Recommended Learning Path
                </CardTitle>
                <CardDescription>
                  Courses and resources to bridge your skill gaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getMissingSkillsForLearning().length > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Skills to Develop</h3>
                      <div className="flex flex-wrap gap-2">
                        {getMissingSkillsForLearning().map((skill) => (
                          <Badge key={skill} variant="outline" className="border-destructive/50 text-destructive">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {learningResources
                        .filter((r) => 
                          getMissingSkillsForLearning().some((s) => 
                            r.skill_name.toLowerCase().includes(s.toLowerCase())
                          )
                        )
                        .slice(0, 6)
                        .map((resource) => (
                          <Card key={resource.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {resource.resource_type}
                                </Badge>
                                {resource.is_free && (
                                  <Badge className="bg-success/10 text-success border-success/20 text-xs">
                                    Free
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-sm mb-1">{resource.resource_title}</h4>
                              <p className="text-xs text-muted-foreground mb-3">
                                {resource.provider} • {resource.skill_name}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => window.open(resource.resource_url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-2" />
                                Start Learning
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Upload your resume and browse jobs to get personalized learning recommendations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
