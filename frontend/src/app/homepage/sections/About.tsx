'use client';

import { motion, useInView } from 'framer-motion';
import { CheckCircle, HeartPulse, Shield, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { useRef } from 'react';

const features = [
  { 
    title: 'AI-Powered Insights', 
    description: 'Get personalized health recommendations based on your unique cycle patterns and symptoms.', 
    icon: <BarChart3 className="w-6 h-6 text-primary" /> 
  },
  { 
    title: 'Symptom Tracking', 
    description: 'Log and monitor symptoms to better understand your body and health patterns.', 
    icon: <HeartPulse className="w-6 h-6 text-primary" /> 
  },
  { 
    title: 'Cycle Prediction', 
    description: 'Accurate period predictions to help you plan ahead with confidence.', 
    icon: <CalendarIcon className="w-6 h-6 text-primary" /> 
  },
  { 
    title: 'Privacy First', 
    description: 'Your data is yours alone. We use end-to-end encryption to keep your information secure.', 
    icon: <Shield className="w-6 h-6 text-primary" /> 
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

function AnimatedAbout() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-20 md:py-28 bg-gradient-to-b from-white to-background-light">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-[500px] h-[500px] bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -left-20 -bottom-20 w-[500px] h-[500px] bg-background-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            About Auralie
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Empowering Your Health Journey
          </h2>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto">
            Auralie combines cutting-edge technology with personalized care to help you understand and manage your menstrual health like never before.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
        >
          <div className="space-y-8">
            <motion.div 
              variants={itemVariants}
              className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-50 overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-0 border-r-0 border-l-[64px] border-l-transparent border-b-[64px] border-b-primary/5 rounded-bl-2xl transition-colors duration-300 group-hover:border-b-primary/10"></div>
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h3>
              <p className="text-text-secondary">
                To provide women with the tools and knowledge they need to take control of their reproductive health, making informed decisions with confidence and ease.
              </p>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="group relative p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-50 overflow-hidden"
              whileHover={{ y: -5 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-0 border-r-0 border-l-[64px] border-l-transparent border-b-[64px] border-b-primary/5 rounded-bl-2xl transition-colors duration-300 group-hover:border-b-primary/10"></div>
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-4">Why Choose Us</h3>
              <p className="text-text-secondary">
                We combine medical expertise with user-friendly design to create a seamless experience that adapts to your unique needs and lifestyle.
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="space-y-6"
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="group flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-50 hover:border-primary/20"
                whileHover={{ 
                  y: -3,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex-shrink-0 p-3 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors duration-300">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-text-secondary">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// Client Component Wrapper
export default function About() {
  return <AnimatedAbout />;
}
