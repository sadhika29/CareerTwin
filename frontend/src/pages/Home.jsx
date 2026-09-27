import LandingNavbar from '../components/landing/LandingNavbar'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'
import HowItWorks from '../components/landing/HowItWorks'
import About from '../components/landing/About'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans overflow-x-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-pink-900/10 blur-[100px]"></div>
      </div>
      
      <div className="relative z-10 flex flex-col">
        <LandingNavbar />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <About />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}
