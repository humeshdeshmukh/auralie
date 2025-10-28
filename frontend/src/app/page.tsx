import Hero from './homepage/sections/Hero';
import Features from './homepage/sections/Features';
import About from './homepage/sections/About';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <section id="about">
        <About />
      </section>
      
      
    </main>
  );
}
