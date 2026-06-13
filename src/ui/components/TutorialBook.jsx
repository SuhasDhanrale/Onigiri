import { BookOpen, Map, ScrollText, Shield, Skull, Sword, X } from 'lucide-react';
import { TUTORIAL_BOOK_SECTIONS } from '../../config/tutorial.js';

const SECTION_ICONS = {
  Story: ScrollText,
  Upgrades: Shield,
  'Map Nodes': Map,
  Enemies: Sword,
  Bosses: Skull,
};

export function TutorialBook({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[430] flex justify-end bg-black/55 text-[#dfd4ba]">
      <button className="absolute inset-0 cursor-default" aria-label="Close tutorial book" onClick={onClose} />
      <aside className="relative z-10 h-full w-[min(430px,100vw)] border-l border-[#d4af37]/35 bg-[#0a0908]/98 shadow-[-30px_0_80px_rgba(0,0,0,0.8)]">
        <div className="flex items-start justify-between border-b border-[#d4af37]/25 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37]">
              <BookOpen size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.35em]">Reference</p>
            </div>
            <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-white">Tutorial Book</h2>
            <p className="mt-2 text-[11px] font-bold leading-snug text-[#dfd4ba]/55">
              Useful knowledge that should not interrupt the first guided run.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#8b8574]/30 text-[#8b8574] hover:border-[#dfd4ba] hover:text-white"
            aria-label="Close tutorial book"
          >
            <X size={17} />
          </button>
        </div>

        <div className="h-[calc(100%-122px)] overflow-y-auto px-5 py-5 custom-scrollbar">
          <div className="space-y-4">
            {TUTORIAL_BOOK_SECTIONS.map((section) => {
              const Icon = SECTION_ICONS[section.title] ?? BookOpen;
              return (
                <section key={section.title} className="border border-[#8b8574]/25 bg-[#141211]">
                  <div className="flex items-center gap-3 border-b border-[#8b8574]/20 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center border border-[#d4af37]/30 text-[#d4af37]">
                      <Icon size={17} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">{section.title}</h3>
                  </div>
                  <div className="divide-y divide-[#8b8574]/15">
                    {section.rows.map(([title, body]) => (
                      <div key={title} className="px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d4af37]">{title}</p>
                        <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#dfd4ba]/68">{body}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
