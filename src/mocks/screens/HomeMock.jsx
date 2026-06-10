import { useState } from 'react';
import { Play, Map, ChevronRight, Lock, ChevronLeft } from 'lucide-react';

export const HomeMock = () => {
  const [view, setView] = useState('main'); // 'main' | 'chapters'
  const [navigated, setNavigated] = useState(null);

  if (navigated) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#1b1918] text-[#dfd4ba]">
        <div className="text-center">
          <Map size={64} className="mx-auto mb-4 opacity-50 text-[#b84235]" />
          <h2 className="text-2xl font-black tracking-widest">MAP SCREEN</h2>
          <p className="mt-2 text-sm opacity-70">Simulated navigation to: {navigated}</p>
          <button 
            className="mt-6 border border-[#dfd4ba]/30 px-6 py-2 text-xs font-bold tracking-widest hover:bg-[#dfd4ba]/10 transition-colors"
            onClick={() => setNavigated(null)}
          >
            RETURN TO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1b1918] font-sans text-[#dfd4ba]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 transition-opacity duration-1000"
        style={{ backgroundImage: 'url(/assets/oni_bg.png)' }}
      />
      
      {/* Vignette / Wash */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b1918] via-[#1b1918]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b1918]/80 via-transparent to-transparent" />

      {/* Main Content */}
      <div className="relative z-10 flex h-full flex-col p-10">
        
        {/* Title Area - Fades out slightly when in chapter select to give focus */}
        <div className={`flex-1 transition-all duration-500 ease-out ${view === 'chapters' ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <h1 className="mt-12 text-7xl font-black tracking-tighter text-white drop-shadow-lg" style={{ fontFamily: 'serif' }}>
            ONIGIRI
          </h1>
          <p className="mt-2 text-xl font-bold tracking-widest text-[#b84235]">DEMON'S WRATH</p>
        </div>

        {/* Dynamic Menu Area */}
        <div className="relative h-[400px]">
          
          {/* MAIN MENU ITEMS */}
          <div className={`absolute bottom-0 left-0 flex flex-col space-y-6 transition-all duration-500 ease-out ${view === 'chapters' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
            
            {/* The Chapter Select Button - Animates "Up" by transitioning out while the actual header transitions in */}
            <button 
              onClick={() => setView('chapters')}
              className={`group flex items-center gap-4 text-left transition-all duration-500 ${view === 'chapters' ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'}`}
            >
              <div className="text-xl font-black tracking-widest text-[#dfd4ba]/70 transition-colors group-hover:text-white">
                CHAPTER SELECT
              </div>
            </button>

            {/* Play Button */}
            <button 
              onClick={() => setNavigated('Continue (Chapter 2)')}
              className={`group flex w-fit items-center gap-6 border-l-4 border-[#b84235] bg-[#dfd4ba]/5 py-4 pl-6 pr-10 backdrop-blur-sm transition-all duration-500 hover:bg-[#dfd4ba]/15 ${view === 'chapters' ? 'translate-y-12 opacity-0' : 'translate-y-0 opacity-100'}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b84235] text-white shadow-[0_0_20px_rgba(184,66,53,0.5)] transition-transform group-hover:scale-110">
                <Play size={24} fill="currentColor" className="ml-1" />
              </div>
              <div className="text-left">
                <div className="text-3xl font-black tracking-widest text-white">PLAY</div>
                <div className="mt-1 text-xs font-bold tracking-wider text-[#dfd4ba]/70">CONTINUE • SIEGE OF KYOTO</div>
              </div>
            </button>
          </div>

          {/* CHAPTER SELECT VIEW */}
          <div className={`absolute inset-0 flex flex-col transition-all duration-500 ease-out ${view === 'chapters' ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-12 opacity-0'}`}>
            
            {/* The "Animated Up" Header */}
            <div className="mb-8 flex items-center gap-4 border-b border-[#dfd4ba]/20 pb-6">
              <button 
                onClick={() => setView('main')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfd4ba]/10 transition-colors hover:bg-[#dfd4ba]/20 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-black tracking-widest text-white">CHAPTER SELECT</h2>
            </div>

            <div className="flex flex-col space-y-3 overflow-y-auto pr-4">
              <button 
                onClick={() => setNavigated('Chapter 1')}
                className="group flex items-center justify-between border border-[#dfd4ba]/20 bg-[#1b1918]/80 p-5 backdrop-blur-sm transition-all hover:border-[#dfd4ba]/40 hover:bg-[#dfd4ba]/10"
              >
                <div className="text-left transition-transform group-hover:translate-x-2">
                  <div className="text-xs font-bold tracking-widest text-[#dfd4ba]/70">CHAPTER I</div>
                  <div className="text-xl font-black tracking-wide text-white">The Awakening</div>
                </div>
                <ChevronRight className="text-[#b84235] opacity-50 transition-all group-hover:translate-x-1 group-hover:opacity-100" size={24} />
              </button>

              <button 
                onClick={() => setNavigated('Chapter 2')}
                className="group flex items-center justify-between border border-[#b84235] bg-[#b84235]/10 p-5 backdrop-blur-sm transition-all hover:bg-[#b84235]/20"
              >
                <div className="text-left transition-transform group-hover:translate-x-2">
                  <div className="text-xs font-bold tracking-widest text-[#b84235]">CHAPTER II • CURRENT</div>
                  <div className="text-xl font-black tracking-wide text-white">Siege of Kyoto</div>
                </div>
                <Play className="text-[#b84235] transition-transform group-hover:scale-110" fill="currentColor" size={24} />
              </button>

              <button 
                disabled
                className="flex items-center justify-between border border-[#dfd4ba]/10 bg-[#1b1918]/60 p-5 opacity-50 backdrop-blur-sm"
              >
                <div className="text-left">
                  <div className="text-xs font-bold tracking-widest text-[#dfd4ba]/50">CHAPTER III</div>
                  <div className="text-xl font-black tracking-wide text-[#dfd4ba]/50">Descent into Yomi</div>
                </div>
                <Lock className="text-[#dfd4ba]/50" size={20} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
