'use client';

import { motion } from 'framer-motion';
import { Calendar, Activity, BarChart3, HeartPulse, Moon, Droplet } from 'lucide-react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: <Calendar className="w-8 h-8 text-primary" />,
    title: 'Cycle Tracking',
    description: 'Accurately track your menstrual cycle and receive predictions for your next period and fertile window.',
    stats: '95% Accuracy'
  },
  {
    icon: <Activity className="w-8 h-8 text-primary" />,
    title: 'Symptom Logging',
    description: 'Easily log symptoms, mood, and other health metrics to identify patterns and triggers.',
    stats: 'Real-time Sync'
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-primary" />,
    title: 'Personalized Insights',
    description: 'Get AI-powered insights and recommendations tailored to your unique cycle and health patterns.',
    stats: 'AI-Powered'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

function AnimatedFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <section ref={ref} className="relative pt-0 pb-20 lg:pb-28 overflow-hidden bg-background-light">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-background-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Our Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Everything You Need for Your Health Journey
          </h2>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto">
            Comprehensive tools designed to give you insights and control over your reproductive health with confidence and clarity.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative p-8 rounded-2xl bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border border-gray-50 hover:border-primary/20 hover:bg-white"
              whileHover={{ y: -5 }}
            >
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-0 border-r-0 border-l-[64px] border-l-transparent border-b-[64px] border-b-primary/5 rounded-bl-2xl transition-colors duration-300 group-hover:border-b-primary/10"></div>
              </div>

              {/* Icon with gradient background */}
              <div className="w-16 h-16 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:shadow-md transition-all duration-300">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-text-primary mb-3 text-center">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-text-secondary mb-6 text-center leading-relaxed">
                {feature.description}
              </p>

              {/* Stats */}
              <div className="flex justify-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-background-light text-primary group-hover:bg-primary/10 transition-colors duration-300 border border-gray-100">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  {feature.stats}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          {[
            { 
              icon: <HeartPulse className="w-6 h-6 text-primary" />, 
              text: 'Comprehensive health tracking' 
            },
            { 
              icon: <Moon className="w-6 h-6 text-primary" />, 
              text: 'Sleep and activity monitoring' 
            },
            { 
              icon: <Droplet className="w-6 h-6 text-primary" />, 
              text: 'Hydration and nutrition logs' 
            }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-white/50 rounded-xl border border-gray-100">
              <div className="p-2 bg-primary/5 rounded-lg">
                {item.icon}
              </div>
              <span className="text-text-primary font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function Features() {
  return <AnimatedFeatures />;
}
