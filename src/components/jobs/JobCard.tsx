import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Clock, DollarSign, Briefcase, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  compatibility_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
}

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  showMatchInfo?: boolean;
  applied?: boolean;
}

export const JobCard = ({ job, onApply, onViewDetails, showMatchInfo = false, applied = false }: JobCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10';
    if (score >= 50) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return null;
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <>
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-accent/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg group-hover:text-accent transition-colors">
                {job.title}
              </CardTitle>
              {job.is_internship && (
                <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
                  Internship
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {job.company}
            </CardDescription>
          </div>
          {showMatchInfo && job.compatibility_score !== undefined && (
            <div className={cn('rounded-lg px-3 py-2 text-center', getScoreColor(job.compatibility_score))}>
              <TrendingUp className="h-4 w-4 mx-auto mb-1" />
              <span className="text-lg font-bold">{job.compatibility_score}%</span>
              <p className="text-xs">Match</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.location}
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {job.job_type}
          </div>
          {formatSalary(job.salary_min, job.salary_max) && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatSalary(job.salary_min, job.salary_max)}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {timeAgo(job.created_at)}
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {job.required_skills.slice(0, 6).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className={cn(
                'text-xs',
                showMatchInfo && job.matched_skills?.includes(skill)
                  ? 'border-success/50 bg-success/5 text-success'
                  : showMatchInfo && job.missing_skills?.includes(skill)
                  ? 'border-destructive/50 bg-destructive/5 text-destructive'
                  : ''
              )}
            >
              {skill}
            </Badge>
          ))}
          {job.required_skills.length > 6 && (
            <Badge variant="outline" className="text-xs">
              +{job.required_skills.length - 6} more
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails?.(job.id)}
          >
            View Details
          </Button>
          {applied ? (
            <Button disabled className="flex-1 bg-success/10 text-success border-success/20">
              Applied
            </Button>
          ) : (
            <Button
              className="flex-1 bg-gradient-accent"
              onClick={() => onApply?.(job.id)}
            >
              Apply Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
};
