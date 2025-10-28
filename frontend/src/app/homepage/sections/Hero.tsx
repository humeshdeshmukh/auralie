import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-background-light to-background-light">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-background-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>
      
      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-0 pb-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 text-sm text-text-secondary mb-4 shadow-sm">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Empowering Women&apos;s Health
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              <span className="relative inline-block">
                <span className="relative z-10">Women&apos;s Health</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-0"></span>
              </span>
              <br />
              <span className="text-primary">Wellness</span> Technology
            </h1>

            <p className="text-lg md:text-xl text-text-secondary max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Predict cycles, track symptoms, and gain personalized insights with our AI-powered menstrual health support platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-medium py-4 px-8 rounded-full transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl hover:shadow-primary/20">
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
              <button className="group relative overflow-hidden border-2 border-primary/30 hover:border-primary/50 text-primary hover:text-primary/90 font-medium py-[14px] px-8 rounded-full transition-all duration-300 bg-white/50 hover:bg-white/70 backdrop-blur-sm">
                <span className="relative z-10 flex items-center gap-2">
                  Learn More
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-text-secondary/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary/80 rounded-full"></div>
                <span>Cycle Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary/80 rounded-full"></div>
                <span>Symptom Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary/80 rounded-full"></div>
                <span>AI Insights</span>
              </div>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="relative h-[400px] lg:h-[550px] w-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full max-w-[450px] mx-auto">
                {/* Floating phone mockup */}
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[40px] p-1.5 shadow-2xl">
                    <div className="relative w-full h-full rounded-[32px] overflow-hidden">
                      <Image
                        src="/WhatsApp Image 2025-10-27 at 19.57.17_cf653f4e.jpg"
                        alt="Woman using Auralie app"
                        fill
                        className="object-cover"
                        priority
                        style={{
                          objectPosition: 'center 20%'
                        }}
                      />
                      {/* App UI overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                  {/* Phone frame */}
                  <div className="absolute inset-0 border-[12px] border-white/50 rounded-[48px] pointer-events-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]"></div>
                  {/* Camera notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white/80 backdrop-blur-sm rounded-b-2xl z-10"></div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary/5 rounded-full -z-10"></div>
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-background-secondary/20 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave separator */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-32 bg-white [clip-path:polygon(0_40%,100%_0,100%_100%,0%_100%)] -mb-1"></div> */}
    </section>
  );
}
