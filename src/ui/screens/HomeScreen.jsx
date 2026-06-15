import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Lock, Play } from 'lucide-react';
import { getCampaignChapters, getCurrentCampaignChapterId } from '../../config/campaign.js';
import { getPublicAssetUrl } from '../../platforms/publicAssets.js';
import { SoundManager } from '../../systems/SoundManager.js';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];
const ONI_BG_URL = getPublicAssetUrl('assets/oni_bg.png');

export function HomeScreen({ meta, onStartChapter, tutorial }) {
  const [view, setView] = useState('main');
  const chapters = useMemo(
    () => getCampaignChapters(meta?.conqueredRegions ?? []),
    [meta?.conqueredRegions]
  );
  const currentChapterId = getCurrentCampaignChapterId(meta?.conqueredRegions ?? []);
  const currentChapter = chapters.find(chapter => chapter.id === currentChapterId) ?? chapters[0];

  const startCurrentChapter = () => {
    tutorial?.completeStep?.('home_start');
    SoundManager.playSfx('chapter_select');
    if (currentChapter) onStartChapter(currentChapter.id);
  };

  const handleChapterClick = (chapter) => {
    if (chapter.status === 'current') {
      tutorial?.completeStep?.('home_start');
      SoundManager.playSfx('chapter_select');
      onStartChapter(chapter.id);
    }
  };

  return (
    <div className="absolute inset-0 z-[300] overflow-hidden bg-[#1b1918] font-sans text-[#dfd4ba]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
        style={{ backgroundImage: `url(${ONI_BG_URL})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b1918] via-[#1b1918]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b1918]/85 via-transparent to-[#1b1918]/30" />

      <div className="relative z-10 flex h-full flex-col px-6 py-8 sm:px-10">
        <div className={`flex-1 transition-all duration-500 ease-out ${view === 'chapters' ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <h1 className="mt-10 text-5xl font-black tracking-normal text-white drop-shadow-lg sm:text-7xl" style={{ fontFamily: 'serif' }}>
            ONIGIRI
          </h1>
          <p className="mt-2 text-lg font-bold tracking-widest text-[#b84235] sm:text-xl">DEMON'S WRATH</p>
        </div>

        <div className="relative h-[430px] max-w-[760px]">
          <div className={`absolute bottom-0 left-0 flex flex-col gap-6 transition-all duration-500 ease-out ${view === 'chapters' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
            <button
              onClick={() => { SoundManager.playSfx('ui_click'); setView('chapters'); }}
              className="group flex w-fit items-center gap-3 text-left text-xl font-black tracking-widest text-[#dfd4ba]/75 transition-colors hover:text-white"
            >
              CHAPTER SELECT
              <ChevronRight size={22} className="text-[#b84235] transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={startCurrentChapter}
              data-tutorial-target="home-play"
              className="group flex w-fit max-w-full items-center gap-5 border-l-4 border-[#b84235] bg-[#dfd4ba]/5 py-4 pl-5 pr-7 text-left backdrop-blur-sm transition-all duration-300 hover:bg-[#dfd4ba]/15 sm:gap-6 sm:pl-6 sm:pr-10"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#b84235] text-white shadow-[0_0_20px_rgba(184,66,53,0.5)] transition-transform group-hover:scale-105">
                <Play size={24} fill="currentColor" className="ml-1" />
              </span>
              <span className="min-w-0">
                <span className="block text-3xl font-black tracking-widest text-white">PLAY</span>
                <span className="mt-1 block text-xs font-bold tracking-wider text-[#dfd4ba]/70">
                  CONTINUE - {currentChapter?.name?.toUpperCase() ?? 'CHAPTER'}
                </span>
              </span>
            </button>
          </div>

          <div className={`absolute inset-0 flex flex-col transition-all duration-500 ease-out ${view === 'chapters' ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-12 opacity-0'}`}>
            <div className="mb-6 flex items-center gap-4 border-b border-[#dfd4ba]/20 pb-5">
              <button
                onClick={() => { SoundManager.playSfx('ui_click'); setView('main'); }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dfd4ba]/10 text-[#dfd4ba] transition-colors hover:bg-[#dfd4ba]/20 hover:text-white"
                aria-label="Back to main menu"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-black tracking-widest text-white">CHAPTER SELECT</h2>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2">
              {chapters.map((chapter) => {
                const isCurrent = chapter.status === 'current';
                const isCompleted = chapter.status === 'completed';
                const isLocked = chapter.status === 'locked';
                const roman = ROMAN_NUMERALS[chapter.chapterNumber - 1] ?? chapter.chapterNumber;

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    disabled={!isCurrent}
                    onClick={() => handleChapterClick(chapter)}
                    className={`group flex items-center justify-between border p-4 text-left backdrop-blur-sm transition-all sm:p-5 ${
                      isCurrent
                        ? 'border-[#b84235] bg-[#b84235]/10 hover:bg-[#b84235]/20'
                        : isCompleted
                          ? 'cursor-default border-[#dfd4ba]/20 bg-[#1b1918]/80'
                          : 'cursor-not-allowed border-[#dfd4ba]/10 bg-[#1b1918]/60 opacity-50'
                    }`}
                  >
                    <span className={`min-w-0 transition-transform ${isCurrent ? 'group-hover:translate-x-2' : ''}`}>
                      <span className={`block text-xs font-bold tracking-widest ${isCurrent ? 'text-[#b84235]' : 'text-[#dfd4ba]/60'}`}>
                        CHAPTER {roman}{isCurrent ? ' - CURRENT' : isCompleted ? ' - COMPLETE' : ''}
                      </span>
                      <span className={`mt-1 block text-xl font-black tracking-wide ${isLocked ? 'text-[#dfd4ba]/50' : 'text-white'}`}>
                        {chapter.name}
                      </span>
                      <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-[#dfd4ba]/55">
                        THREAT {chapter.threatLevel} - {chapter.reward}
                      </span>
                    </span>

                    {isCurrent && <Play className="ml-4 shrink-0 text-[#b84235] transition-transform group-hover:scale-110" fill="currentColor" size={24} />}
                    {isCompleted && <Check className="ml-4 shrink-0 text-[#d4af37]" size={22} />}
                    {isLocked && <Lock className="ml-4 shrink-0 text-[#dfd4ba]/50" size={20} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
