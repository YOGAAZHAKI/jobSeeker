import { supabase } from '@/integrations/supabase/client';

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  salary_info: string | null;
  source_url: string;
  source: string;
  updated_at: string;
  is_external: boolean;
  required_skills: string[];
  compatibility_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
}

export type JobCategory = 'machine-learning' | 'full-stack' | 'frontend' | 'backend' | 'data-science' | 'devops';

const categoryKeywords: Record<JobCategory, string> = {
  'machine-learning': 'machine learning AI deep learning',
  'full-stack': 'full stack developer fullstack',
  'frontend': 'frontend react vue angular',
  'backend': 'backend nodejs python java',
  'data-science': 'data scientist analytics',
  'devops': 'devops cloud engineer SRE',
};

export async function fetchExternalJobs(
  category: JobCategory = 'machine-learning',
  location: string = '',
  page: number = 1
): Promise<{ jobs: ExternalJob[]; totalCount: number }> {
  const keywords = categoryKeywords[category];

  const { data, error } = await supabase.functions.invoke('fetch-jobs', {
    body: { keywords, location, page },
  });

  if (error) {
    console.error('Error fetching external jobs:', error);
    throw new Error(error.message);
  }

  return data;
}

export function calculateJobMatch(
  userSkills: string[],
  jobSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (!userSkills.length || !jobSkills.length) {
    return { score: 0, matched: [], missing: jobSkills };
  }

  const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase());

  const matched = jobSkills.filter(skill =>
    normalizedUserSkills.some(
      userSkill =>
        userSkill.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill)
    )
  );

  const missing = jobSkills.filter(skill => !matched.includes(skill));

  const score = jobSkills.length > 0 
    ? Math.round((matched.length / jobSkills.length) * 100) 
    : 0;

  return { score, matched, missing };
}

export function enrichJobsWithMatchScore(
  jobs: ExternalJob[],
  userSkills: string[]
): ExternalJob[] {
  return jobs.map(job => {
    const { score, matched, missing } = calculateJobMatch(userSkills, job.required_skills);
    return {
      ...job,
      compatibility_score: score,
      matched_skills: matched,
      missing_skills: missing,
    };
  }).sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
}