import { CheckCircle } from 'lucide-react';

export default function About() {
  const features = [
    {
      title: 'AI-Powered Insights',
      description: 'Get personalized health recommendations based on your unique cycle patterns and symptoms.',
      icon: <CheckCircle className="w-6 h-6 text-primary" />
    },
    {
      title: 'Symptom Tracking',
      description: 'Log and monitor symptoms to better understand your body and health patterns.',
      icon: <CheckCircle className="w-6 h-6 text-primary" />
    },
    {
      title: 'Cycle Prediction',
      description: 'Accurate period predictions to help you plan ahead with confidence.',
      icon: <CheckCircle className="w-6 h-6 text-primary" />
    },
    {
      title: 'Privacy First',
      description: 'Your data is yours alone. We prioritize your privacy and security.',
      icon: <CheckCircle className="w-6 h-6 text-primary" />
    }
  ];

  return (
    <section className="relative py-20 md:py-28 bg-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-background-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            About Auralie
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Empowering Your Health Journey
          </h2>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto">
            Auralie combines cutting-edge technology with personalized care to help you understand and manage your menstrual health like never before.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-50">
              <h3 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h3>
              <p className="text-text-secondary">
                To provide women with the tools and knowledge they need to take control of their reproductive health through innovative technology and evidence-based insights.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-50">
              <h3 className="text-2xl font-bold text-text-primary mb-4">Why Choose Us</h3>
              <p className="text-text-secondary">
                We combine medical expertise with user-friendly design to create a seamless experience that puts your health and privacy first.
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-50">
                <div className="flex-shrink-0 mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-text-secondary">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
