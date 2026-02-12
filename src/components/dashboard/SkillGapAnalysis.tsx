import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillGapAnalysisProps {
  matchedSkills: string[];
  missingSkills: string[];
  compatibilityScore: number;
  jobTitle?: string;
}

export const SkillGapAnalysis = ({
  matchedSkills,
  missingSkills,
  compatibilityScore,
  jobTitle,
}: SkillGapAnalysisProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 50) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Skill Gap Analysis
        </CardTitle>
        {jobTitle && <CardDescription>Analysis for: {jobTitle}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compatibility Score */}
        <div className={cn('rounded-xl p-6 text-center', getScoreBg(compatibilityScore))}>
          <p className="text-sm font-medium text-muted-foreground mb-2">Compatibility Score</p>
          <p className={cn('text-5xl font-bold', getScoreColor(compatibilityScore))}>
            {compatibilityScore}%
          </p>
          <div className="mt-4 max-w-xs mx-auto">
            <Progress
              value={compatibilityScore}
              className="h-3"
              style={{
                // @ts-ignore
                '--progress-background': getProgressColor(compatibilityScore),
              }}
            />
          </div>
        </div>

        {/* Matched Skills */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="font-semibold">Matched Skills ({matchedSkills.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-success/10 text-success border-success/20">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No skills matched yet</p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold">Skills to Develop ({missingSkills.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">You have all required skills!</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
};
