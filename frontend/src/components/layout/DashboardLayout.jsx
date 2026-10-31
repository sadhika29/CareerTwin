import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAF7FD] text-[#27113D] flex font-sans relative selection:bg-[#ED96D7]/25 selection:text-[#4C2365]">
      {/* Subtle ambient background glow orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#ED96D7]/10 blur-[130px]" />
        <div className="absolute top-[35%] left-[20%] w-[35%] h-[35%] rounded-full bg-[#C4A4DA]/12 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[40%] h-[40%] rounded-full bg-[#7F5D99]/8 blur-[120px]" />
      </div>

      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#27113D]/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth">
          <div className="max-w-[1440px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
