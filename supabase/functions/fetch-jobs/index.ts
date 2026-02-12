import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: string;
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords = "machine learning", location = "", page = 1 } = await req.json();

    const joobleApiKey = Deno.env.get("JOOBLE_API_KEY");
    if (!joobleApiKey) {
      throw new Error("JOOBLE_API_KEY is not configured");
    }

    console.log(`Fetching jobs for: ${keywords} in ${location || 'any location'}`);

    const response = await fetch(`https://jooble.org/api/${joobleApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keywords,
        location,
        page,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jooble API error:", response.status, errorText);
      throw new Error(`Jooble API error: ${response.status}`);
    }

    const data: JoobleResponse = await response.json();
    
    // Transform Jooble jobs to our format
    const transformedJobs = data.jobs.map((job) => ({
      id: job.id || crypto.randomUUID(),
      title: job.title,
      company: job.company || job.source || "Company",
      location: job.location || "Remote",
      job_type: job.type || "Full-time",
      description: job.snippet,
      salary_info: job.salary || null,
      source_url: job.link,
      source: job.source,
      updated_at: job.updated,
      is_external: true,
      required_skills: extractSkillsFromDescription(job.snippet + " " + job.title),
    }));

    return new Response(
      JSON.stringify({ 
        jobs: transformedJobs, 
        totalCount: data.totalCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Extract skills from job description using keyword matching
function extractSkillsFromDescription(text: string): string[] {
  const skillKeywords = [
    // Programming Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Scala", "Kotlin", "Swift",
    // ML/AI
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "NLP", "Computer Vision",
    "Neural Networks", "AI", "Artificial Intelligence", "LLM", "GPT", "Transformers", "BERT", "OpenAI",
    // Data Science
    "Data Science", "Pandas", "NumPy", "Data Analysis", "Statistics", "R", "Jupyter", "Data Visualization",
    // Web/Full Stack
    "React", "Vue", "Angular", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot",
    "HTML", "CSS", "Tailwind", "Next.js", "GraphQL", "REST API", "MongoDB", "PostgreSQL", "MySQL", "Redis",
    // Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Linux", "Git", "Terraform", "Jenkins",
    // Other
    "SQL", "NoSQL", "Microservices", "Agile", "Scrum", "API Development", "Unit Testing"
  ];

  const lowerText = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => 
    lowerText.includes(skill.toLowerCase())
  );

  return [...new Set(foundSkills)].slice(0, 10); // Return unique skills, max 10
}
