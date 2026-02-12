import { 
  FileText, 
  Target, 
  BookOpen, 
  Users, 
  Zap, 
  Shield,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: FileText,
    title: 'Smart Resume Parsing',
    description: 'Our AI extracts skills, experience, and qualifications from your resume in seconds.',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    description: 'Compare your skills against job requirements and see exactly what you need to learn.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: BarChart3,
    title: 'Compatibility Scoring',
    description: 'Get a precise match score for each job based on your unique skill profile.',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: BookOpen,
    title: 'Learning Paths',
    description: 'Personalized course recommendations to fill your skill gaps quickly.',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    icon: Users,
    title: 'Recruiter Matching',
    description: 'Connect with recruiters looking for exactly your skill set.',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Get intelligent job suggestions based on your career trajectory.',
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Updates',
    description: 'Stay updated with new job matches as they become available.',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is encrypted and never shared without your consent.',
    color: 'bg-slate-500/10 text-slate-500',
  },
];

export const Features = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-sm font-medium text-accent mb-4"
          >
            POWERFUL FEATURES
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground"
          >
            Everything You Need to
            <br />
            <span className="text-accent">Accelerate Your Career</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            From resume analysis to job matching, we provide all the tools you need to land your dream position.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
