import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) { 
  return (
    <main className="min-h-screen flex bg-background">
      {/* Left Side - Branding & Illustration */}
      <div className="hidden lg:flex flex-1 flex-col bg-sidebar text-white relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-ai/20 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 p-12 flex flex-col h-full">
          <Link to="/" className="inline-flex items-center gap-3 text-white mb-20 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-heading font-bold text-xl shadow-lg">
              C
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight">CareerTwin</span>
          </Link>

          <div className="mt-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full mb-6">
              <Sparkles size={16} className="text-ai" />
              <span className="text-sm font-semibold tracking-wide text-white/90">AI-Powered Platform</span>
            </div>
            <h1 className="text-5xl font-heading font-bold leading-tight mb-6 text-white">
              Build the career <br />you're ready for.
            </h1>
            <p className="text-lg text-text-muted max-w-md leading-relaxed">
              CareerTwin analyzes your profile, identifies skill gaps, and helps you prepare for the interviews that matter most.
            </p>
          </div>

          {/* Simple illustration / visualization */}
          <div className="relative w-full max-w-lg mx-auto aspect-video bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl flex items-center justify-center mt-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-ai/20 opacity-50"></div>
            <div className="w-full flex justify-between items-end px-8 py-6 h-full">
              {[40, 70, 45, 90, 65].map((h, i) => (
                <div key={i} className="w-12 bg-white/10 rounded-t-lg relative" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-primary/50 to-primary/0 rounded-t-lg" style={{ height: '100%' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-background relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-10 text-text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-heading font-bold text-lg">
              C
            </div>
            <span className="font-heading font-bold text-xl">CareerTwin</span>
          </Link>

          <div className="mb-8">
            <div className="text-primary text-sm font-bold uppercase tracking-wider mb-2">{eyebrow}</div>
            <h2 className="text-3xl font-heading font-bold text-text-primary mb-3">{title}</h2>
            <p className="text-text-secondary">{subtitle}</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-subtle border border-border">
            {children}
          </div>
          
          {footer && (
            <div className="mt-8 text-center text-sm text-text-secondary">
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
