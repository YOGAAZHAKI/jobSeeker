import { motion } from 'framer-motion';
import { Upload, Cpu, BarChart3, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Resume',
    description: 'Simply upload your resume in PDF or DOCX format. Our system accepts most standard resume formats.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Skill Extraction',
    description: 'Our advanced AI analyzes your resume to identify technical skills, soft skills, and experience levels.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Gap Analysis',
    description: 'Compare your skill profile against job requirements to see matched skills, missing skills, and compatibility scores.',
  },
  {
    number: '04',
    icon: Rocket,
    title: 'Get Matched & Learn',
    description: 'Receive personalized job matches and curated learning paths to bridge your skill gaps.',
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-sm font-medium text-accent mb-4"
          >
            HOW IT WORKS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground"
          >
            Four Simple Steps to
            <br />
            <span className="text-accent">Your Dream Career</span>
          </motion.h2>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border hidden lg:block -translate-x-1/2" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-8 items-center ${
                  index % 2 === 1 ? 'lg:direction-rtl' : ''
                }`}
              >
                {/* Content */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-2 lg:text-left' : 'lg:text-right'}`}>
                  <div className={`inline-block ${index % 2 === 1 ? '' : 'lg:ml-auto'}`}>
                    <span className="text-6xl font-bold text-muted/50">{step.number}</span>
                    <div className="mt-4">
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-2 text-muted-foreground max-w-md">{step.description}</p>
                    </div>
                  </div>
                </div>

                {/* Icon */}
                <div className={`mt-8 lg:mt-0 ${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <div className={`relative ${index % 2 === 1 ? 'lg:mr-auto' : 'lg:ml-auto'} w-fit`}>
                    {/* Circle on line */}
                    <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent border-4 border-background" />
                    
                    <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-accent shadow-lg mx-auto lg:mx-0">
                      <step.icon className="h-10 w-10 text-accent-foreground" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
