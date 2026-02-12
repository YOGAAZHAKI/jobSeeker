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

const JOOBLE_API_KEY = import.meta.env.VITE_JOOBLE_API_KEY;

export async function fetchExternalJobs(
  category: JobCategory = 'machine-learning',
  location: string = '',
  page: number = 1
): Promise<{ jobs: ExternalJob[]; totalCount: number }> {
  // Use categoryKeywords to map our categories to search terms
  const keywords = categoryKeywords[category];

  // If no API key is set, return empty (or mock data if preferred, but for now empty)
  if (!JOOBLE_API_KEY) {
    console.warn('VITE_JOOBLE_API_KEY is not set');
    throw new Error('Jooble API key is missing. Please add VITE_JOOBLE_API_KEY to your .env file.');
  }

  try {
    const response = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: keywords,
        location: location,
        page: page,
      }),
    });

    if (!response.ok) {
      throw new Error(`Jooble API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map Jooble response format to our ExternalJob interface
    // Note: Jooble response structure is { totalCount: number, jobs: Array<{ id, title, location, snippet, salary, source, type, link, updated, company }> }
    const jobs: ExternalJob[] = (data.jobs || []).map((job: any) => ({
      id: job.id?.toString() || Math.random().toString(36).substr(2, 9),
      title: job.title || 'Untitled Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      job_type: job.type || 'Full-time',
      description: job.snippet || '', // Jooble returns a snippet, full description is on their site
      salary_info: job.salary || null,
      source_url: job.link,
      source: 'Jooble',
      updated_at: job.updated ? new Date(job.updated).toISOString() : new Date().toISOString(),
      is_external: true,
      required_skills: [], // Jooble doesn't return structured skills, would need extraction logic or leave empty
      compatibility_score: 0,
    }));

    return {
      jobs,
      totalCount: data.totalCount || 0
    };

  } catch (error: any) {
    console.error('Error fetching external jobs:', error);
    // Fallback or rethrow
    throw new Error(error.message || 'Failed to fetch jobs from Jooble');
  }
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