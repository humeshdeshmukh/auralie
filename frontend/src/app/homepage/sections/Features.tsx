export default function Features() {
  const features = [
    {
      icon: (
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ),
      title: 'Cycle Tracking',
      description: 'Accurately track your menstrual cycle and receive predictions for your next period and fertile window.',
      stats: '95% Accuracy'
    },
    {
      icon: (
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      ),
      title: 'Symptom Logging',
      description: 'Easily log symptoms, mood, and other health metrics to identify patterns and triggers.',
      stats: 'Real-time Sync'
    },
    {
      icon: (
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      ),
      title: 'Personalized Insights',
      description: 'Get AI-powered insights and recommendations tailored to your unique cycle and health patterns.',
      stats: 'AI-Powered'
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6 leading-tight">
            How Auralie Helps You
          </h2>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto">
            Powerful features designed by women, for women, to help you take control of your health journey with confidence and clarity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-primary/20"
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                {index + 1}
              </div>

              {/* Icon Container */}
              <div className="flex justify-center mb-6">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-text-primary mb-3 text-center">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-text-secondary mb-6 text-center">
                {feature.description}
              </p>

              {/* Stats */}
              <div className="flex justify-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-background-light text-primary group-hover:bg-primary/10 transition-colors duration-300">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  {feature.stats}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-text-secondary mb-6 text-lg">Ready to take control of your health?</p>
          <button className="bg-primary text-white px-8 py-3 rounded-full font-medium text-lg hover:bg-primary/90 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            Start Your Journey Today
          </button>
        </div>
      </div>
    </section>
  );
}
