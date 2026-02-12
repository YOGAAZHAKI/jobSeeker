import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExternalJobCard } from '@/components/jobs/ExternalJobCard';
import { JobCard } from '@/components/jobs/JobCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, Sparkles, Globe, Building2, BrainCircuit, Code2, Database, Cloud, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchExternalJobs, enrichJobsWithMatchScore, type ExternalJob, type JobCategory } from '@/lib/api/jobsApi';

interface LocalJob {
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

const categoryInfo: Record<JobCategory, { label: string; icon: React.ElementType; color: string }> = {
  'machine-learning': { label: 'Machine Learning', icon: BrainCircuit, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  'full-stack': { label: 'Full Stack', icon: Code2, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  'frontend': { label: 'Frontend', icon: Code2, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  'backend': { label: 'Backend', icon: Database, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  'data-science': { label: 'Data Science', icon: BarChart3, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  'devops': { label: 'DevOps', icon: Cloud, color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
};

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [localJobs, setLocalJobs] = useState<LocalJob[]>([]);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>('machine-learning');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('external');

  useEffect(() => {
    fetchLocalJobs();
    if (user) {
      fetchApplications();
      fetchUserSkills();
    }
  }, [user]);

  useEffect(() => {
    fetchExternalJobsData();
  }, [selectedCategory, locationFilter]);

  const fetchLocalJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocalJobs(data || []);
    } catch (error) {
      console.error('Error fetching local jobs:', error);
    } finally {
      setLoadingLocal(false);
    }
  };

  const fetchUserSkills = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('resumes')
      .select('extracted_skills')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.extracted_skills) {
      setUserSkills(data.extracted_skills);
    }
  };

  const fetchExternalJobsData = async () => {
    setLoadingExternal(true);
    try {
      const { jobs } = await fetchExternalJobs(selectedCategory, locationFilter);
      const enrichedJobs = userSkills.length > 0 
        ? enrichJobsWithMatchScore(jobs, userSkills)
        : jobs;
      setExternalJobs(enrichedJobs);
    } catch (error) {
      console.error('Error fetching external jobs:', error);
      toast.error('Failed to load external jobs. Please check API key configuration.');
    } finally {
      setLoadingExternal(false);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('user_id', user.id);

    if (data) {
      setApplications(data.map((a) => a.job_id));
    }
  };

  const handleApplyLocal = async (jobId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase.from('job_applications').insert({
        job_id: jobId,
        user_id: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this job');
        } else {
          throw error;
        }
        return;
      }

      setApplications([...applications, jobId]);
      toast.success('Application submitted!');
    } catch (error) {
      toast.error('Failed to apply');
    }
  };

  const handleApplyExternal = (job: ExternalJob) => {
    window.open(job.source_url, '_blank');
    toast.success('Redirecting to job application...');
  };

  const filteredLocalJobs = localJobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.required_skills.some((s) => s.toLowerCase().includes(query))
    );
  });

  const filteredExternalJobs = externalJobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.required_skills.some((s) => s.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-accent" />
            Browse Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time job listings from 70+ job boards including Indeed, Glassdoor, LinkedIn & more
          </p>
        </div>

        {/* Category Filter - Prominent */}
        <div className="bg-card rounded-xl p-4 mb-6 shadow-sm border">
          <p className="text-sm font-medium text-muted-foreground mb-3">Select Category</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryInfo) as JobCategory[]).map((cat) => {
              const { label, icon: Icon, color } = categoryInfo[cat];
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? 'bg-accent text-accent-foreground' : color}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search and Location */}
        <div className="bg-card rounded-xl p-4 mb-8 shadow-sm border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs, companies, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Location (e.g., San Francisco, Remote)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full md:w-[250px]"
            />
            <Button 
              onClick={fetchExternalJobsData}
              disabled={loadingExternal}
              className="bg-accent hover:bg-accent/90"
            >
              {loadingExternal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>
          {userSkills.length > 0 && (
            <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
              <p className="text-sm text-success flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Jobs are ranked by skill match based on your resume ({userSkills.length} skills detected)
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              External Jobs ({filteredExternalJobs.length})
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Our Platform ({filteredLocalJobs.length})
            </TabsTrigger>
          </TabsList>

          {/* External Jobs Tab */}
          <TabsContent value="external">
            {loadingExternal ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-muted-foreground">Fetching {categoryInfo[selectedCategory].label} jobs...</p>
              </div>
            ) : filteredExternalJobs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No external jobs found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different category or location</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExternalJobs.map((job) => (
                  <ExternalJobCard
                    key={job.id}
                    job={job}
                    onApply={() => handleApplyExternal(job)}
                    showMatchInfo={userSkills.length > 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Local Jobs Tab */}
          <TabsContent value="local">
            {loadingLocal ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filteredLocalJobs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No jobs posted on our platform yet</p>
                <p className="text-sm text-muted-foreground mt-1">Recruiters can post jobs from their dashboard</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLocalJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    applied={applications.includes(job.id)}
                    onApply={handleApplyLocal}
                    onViewDetails={(id) => navigate(`/jobs/${id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Jobs;