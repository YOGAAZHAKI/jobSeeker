import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, Search, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Hero = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <section className="relative overflow-hidden bg-premium-hero py-24 md:py-36 lg:py-40">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
      
      {/* Premium Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(0 0% 100%) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/15 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '4s' }} />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl lg:text-7xl"
          >
            Turn Your{' '}
            <span className="relative">
              <span className="relative z-10 text-accent">Resume</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C50 2 150 2 198 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-accent/40" />
              </svg>
            </span>
            <br />
            Into Career Insights
          </motion.h1>

          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-lg text-primary-foreground/80 md:text-xl max-w-2xl mx-auto"
          >
            Upload your resume, discover skill gaps, and get personalized learning paths. 
            Our AI matches you with jobs where you'll thrive.
          </motion.p>

          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow min-w-[200px] h-12 text-base"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              onClick={() => navigate('/jobs')}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow min-w-[200px] h-12 text-base"
            >
              <Search className="ml-2 h-5 w-5" />
              Browse Jobs
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {[
              { value: '10K+', label: 'Jobs Analyzed' },
              { value: '50K+', label: 'Resumes Processed' },
              { value: '95%', label: 'Match Accuracy' },
              { value: '2.5x', label: 'Faster Hiring' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-accent md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-primary-foreground/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating Cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-20 hidden lg:block"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Process Steps Cards */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Upload, title: 'Upload Resume', desc: 'PDF or DOCX format' },
                { icon: Search, title: 'AI Analysis', desc: 'Skill extraction & matching' },
                { icon: CheckCircle2, title: 'Get Matched', desc: 'Personalized recommendations' },
              ].map((step, i) => (
                <div
                  key={i}
                  className="glass-premium rounded-2xl p-6 animate-float"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-accent shadow-lg">
                      <step.icon className="h-7 w-7 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
