-- Create role enum
CREATE TYPE public.app_role AS ENUM ('job_seeker', 'recruiter');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create skills table (master list of skills)
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  parsed_content TEXT,
  extracted_skills TEXT[],
  parsed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'full-time',
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  is_internship BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  compatibility_score DECIMAL(5,2),
  matched_skills TEXT[],
  missing_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)
);

-- Create learning_resources table
CREATE TABLE public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  resource_url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'course',
  provider TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Skills policies (public read)
CREATE POLICY "Anyone can view skills"
  ON public.skills FOR SELECT
  USING (true);

-- Resumes policies
CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can view resumes of applicants"
  ON public.resumes FOR SELECT
  USING (
    public.has_role(auth.uid(), 'recruiter') AND
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.jobs j ON ja.job_id = j.id
      WHERE ja.resume_id = resumes.id
      AND j.recruiter_id = auth.uid()
    )
  );

-- Jobs policies
CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Recruiters can view all their jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can insert their own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Recruiters can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete their own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = recruiter_id);

-- Job applications policies
CREATE POLICY "Users can view their own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can view applications to their jobs"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

CREATE POLICY "Job seekers can create applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'job_seeker'));

CREATE POLICY "Users can update their own applications"
  ON public.job_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can update applications to their jobs"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Learning resources policies (public read)
CREATE POLICY "Anyone can view learning resources"
  ON public.learning_resources FOR SELECT
  USING (true);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage policies for resumes
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resumes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruiters can view applicant resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    public.has_role(auth.uid(), 'recruiter')
  );

-- Trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial skills
INSERT INTO public.skills (name, category) VALUES
  ('JavaScript', 'Programming'),
  ('TypeScript', 'Programming'),
  ('Python', 'Programming'),
  ('React', 'Frontend'),
  ('Node.js', 'Backend'),
  ('SQL', 'Database'),
  ('MongoDB', 'Database'),
  ('AWS', 'Cloud'),
  ('Docker', 'DevOps'),
  ('Git', 'Tools'),
  ('Machine Learning', 'AI/ML'),
  ('Data Analysis', 'Data Science'),
  ('Communication', 'Soft Skills'),
  ('Leadership', 'Soft Skills'),
  ('Problem Solving', 'Soft Skills'),
  ('Java', 'Programming'),
  ('C++', 'Programming'),
  ('Kotlin', 'Programming'),
  ('Swift', 'Programming'),
  ('Go', 'Programming'),
  ('Rust', 'Programming'),
  ('Vue.js', 'Frontend'),
  ('Angular', 'Frontend'),
  ('Next.js', 'Frontend'),
  ('Express.js', 'Backend'),
  ('Django', 'Backend'),
  ('FastAPI', 'Backend'),
  ('PostgreSQL', 'Database'),
  ('Redis', 'Database'),
  ('GraphQL', 'API'),
  ('REST API', 'API'),
  ('Kubernetes', 'DevOps'),
  ('CI/CD', 'DevOps'),
  ('Azure', 'Cloud'),
  ('GCP', 'Cloud'),
  ('TensorFlow', 'AI/ML'),
  ('PyTorch', 'AI/ML'),
  ('NLP', 'AI/ML'),
  ('Figma', 'Design'),
  ('UI/UX Design', 'Design'),
  ('Agile', 'Methodology'),
  ('Scrum', 'Methodology'),
  ('Project Management', 'Soft Skills'),
  ('Teamwork', 'Soft Skills'),
  ('Critical Thinking', 'Soft Skills');

-- Insert sample learning resources
INSERT INTO public.learning_resources (skill_name, resource_title, resource_url, resource_type, provider, is_free) VALUES
  ('JavaScript', 'JavaScript: The Complete Guide', 'https://www.udemy.com/course/javascript-the-complete-guide/', 'course', 'Udemy', false),
  ('JavaScript', 'freeCodeCamp JavaScript', 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', 'course', 'freeCodeCamp', true),
  ('React', 'React - The Complete Guide', 'https://www.udemy.com/course/react-the-complete-guide/', 'course', 'Udemy', false),
  ('React', 'React Documentation', 'https://react.dev/learn', 'documentation', 'React Team', true),
  ('Python', 'Python for Everybody', 'https://www.coursera.org/specializations/python', 'course', 'Coursera', true),
  ('TypeScript', 'TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/', 'documentation', 'Microsoft', true),
  ('Node.js', 'The Complete Node.js Developer', 'https://www.udemy.com/course/the-complete-nodejs-developer-course/', 'course', 'Udemy', false),
  ('SQL', 'SQL for Data Science', 'https://www.coursera.org/learn/sql-for-data-science', 'course', 'Coursera', true),
  ('Machine Learning', 'Machine Learning by Andrew Ng', 'https://www.coursera.org/learn/machine-learning', 'course', 'Coursera', true),
  ('AWS', 'AWS Certified Solutions Architect', 'https://aws.amazon.com/certification/', 'certification', 'Amazon', false),
  ('Docker', 'Docker for Beginners', 'https://docker-curriculum.com/', 'tutorial', 'Docker', true),
  ('Git', 'Git & GitHub Crash Course', 'https://www.youtube.com/watch?v=RGOj5yH7evk', 'video', 'YouTube', true);