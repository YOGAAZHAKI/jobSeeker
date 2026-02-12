import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, ExternalLink, TrendingUp, Clock, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExternalJob } from '@/lib/api/jobsApi';

interface ExternalJobCardProps {
  job: ExternalJob;
  onApply: () => void;
  showMatchInfo?: boolean;
}

export const ExternalJobCard = ({ job, onApply, showMatchInfo = false }: ExternalJobCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10 border-success/30';
    if (score >= 50) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-destructive bg-destructive/10 border-destructive/30';
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
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-accent/50 relative overflow-hidden">
      {/* External indicator */}
      <div className="absolute top-0 right-0 bg-info/10 text-info text-xs px-2 py-1 rounded-bl-lg flex items-center gap-1">
        <ExternalLink className="h-3 w-3" />
        {job.source}
      </div>

      <CardHeader className="pb-3 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg group-hover:text-accent transition-colors line-clamp-2">
              {job.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {job.company}
            </CardDescription>
          </div>
          {showMatchInfo && job.compatibility_score !== undefined && (
            <div className={cn('rounded-lg px-3 py-2 text-center border', getScoreColor(job.compatibility_score))}>
              <TrendingUp className="h-4 w-4 mx-auto mb-1" />
              <span className="text-lg font-bold">{job.compatibility_score}%</span>
              <p className="text-xs">Match</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.location}
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {job.job_type}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {timeAgo(job.updated_at)}
          </div>
        </div>

        {/* Salary if available */}
        {job.salary_info && (
          <p className="text-sm font-medium text-success">{job.salary_info}</p>
        )}

        {/* Description preview */}
        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {job.required_skills.slice(0, 5).map((skill) => (
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
          {job.required_skills.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{job.required_skills.length - 5} more
            </Badge>
          )}
        </div>

        {/* Action */}
        <Button
          className="w-full bg-gradient-accent hover:opacity-90"
          onClick={onApply}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Apply on {job.source}
        </Button>
      </CardContent>
    </Card>
    </>
  );
};