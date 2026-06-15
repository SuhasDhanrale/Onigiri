import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronLeft, X } from 'lucide-react';
import { getPublicAssetUrl } from '../../platforms/publicAssets.js';

const PANEL_W = 320;
const PANEL_H_ESTIMATE = 250;
const GAP = 16;
const ONI_BG_URL = getPublicAssetUrl('assets/oni_bg.png');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPanelPosition(rect, placement) {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const minX = 16;
  const maxX = Math.max(minX, viewportW - PANEL_W - 16);
  const minY = 16;
  const maxY = Math.max(minY, viewportH - PANEL_H_ESTIMATE - 16);

  if (!rect) {
    return {
      left: clamp((viewportW - PANEL_W) / 2, minX, maxX),
      top: clamp(viewportH * 0.55, minY, maxY),
    };
  }

  const centeredY = rect.top + (rect.height / 2) - (PANEL_H_ESTIMATE / 2);
  const centeredX = rect.left + (rect.width / 2) - (PANEL_W / 2);

  if (placement === 'left') {
    const preferred = rect.left - PANEL_W - GAP;
    return {
      left: preferred >= minX ? preferred : clamp(rect.right + GAP, minX, maxX),
      top: clamp(centeredY, minY, maxY),
    };
  }

  if (placement === 'bottom') {
    const preferred = rect.bottom + GAP;
    return {
      left: clamp(centeredX, minX, maxX),
      top: preferred + PANEL_H_ESTIMATE <= viewportH ? preferred : clamp(rect.top - PANEL_H_ESTIMATE - GAP, minY, maxY),
    };
  }

  const preferred = rect.right + GAP;
  return {
    left: preferred + PANEL_W <= viewportW ? preferred : clamp(rect.left - PANEL_W - GAP, minX, maxX),
    top: clamp(centeredY, minY, maxY),
  };
}

function useTargetRect(target) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return undefined;
    }

    let frame = 0;
    let observer = null;

    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const element = document.querySelector(`[data-tutorial-target="${target}"]`);
        setRect(element ? element.getBoundingClientRect() : null);
        if (element && !observer) {
          observer = new ResizeObserver(measure);
          observer.observe(element);
        }
      });
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer?.disconnect();
    };
  }, [target]);

  return rect;
}

function useTutorialInteractionGuard(step) {
  useEffect(() => {
    if (!step || step.mode === 'monologue') return undefined;

    const isAllowedTarget = (eventTarget) => {
      if (eventTarget?.closest?.('[data-tutorial-ui="true"]')) return true;
      if (!step.target) return false;

      const targetElements = Array.from(document.querySelectorAll(`[data-tutorial-target="${step.target}"]`));
      return targetElements.some(element => element.contains(eventTarget));
    };

    const blockOutsideTarget = (event) => {
      if (isAllowedTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    document.addEventListener('pointerdown', blockOutsideTarget, true);
    document.addEventListener('click', blockOutsideTarget, true);
    document.addEventListener('touchstart', blockOutsideTarget, true);

    return () => {
      document.removeEventListener('pointerdown', blockOutsideTarget, true);
      document.removeEventListener('click', blockOutsideTarget, true);
      document.removeEventListener('touchstart', blockOutsideTarget, true);
    };
  }, [step]);
}

function StepBody({ body }) {
  if (Array.isArray(body)) {
    return (
      <div className="space-y-3">
        {body.map((line) => (
          <p key={line} className="text-sm font-bold leading-relaxed text-[#dfd4ba]/85">{line}</p>
        ))}
      </div>
    );
  }

  return <p className="text-sm font-bold leading-relaxed text-[#dfd4ba]/85">{body}</p>;
}

function MonologueOverlay({ step, onComplete, onSkip, onOpenBook }) {
  return (
    <div data-tutorial-ui="true" className="fixed inset-0 z-[420] flex items-center justify-center overflow-hidden bg-[#090807] text-[#dfd4ba]">
      <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${ONI_BG_URL})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090807]/95 via-[#1b1918]/85 to-[#090807]/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(184,66,53,0.18),_transparent_58%)]" />

      <div className="relative z-10 w-[min(540px,calc(100vw-32px))] border border-[#d4af37]/35 bg-[#0a0908]/90 shadow-[0_35px_90px_rgba(0,0,0,0.9)]">
        <div className="border-b border-[#d4af37]/20 px-7 py-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#b84235]">{step.label}</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.18em] text-white sm:text-3xl">{step.title}</h1>
        </div>

        <div className="px-7 py-6">
          <StepBody body={step.body} />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onOpenBook}
              className="flex items-center gap-2 border border-[#d4af37]/30 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/10"
            >
              <BookOpen size={13} />
              Book
            </button>
            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#8b8574] hover:text-white"
              >
                <X size={12} />
                Skip
              </button>
              <button
                onClick={onComplete}
                className="flex items-center gap-2 bg-[#b84235] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#d65242]"
              >
                Continue
                <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialOverlay({ step, completedCount, totalSteps, onComplete, onSkip, onOpenBook }) {
  const rect = useTargetRect(step?.target);
  useTutorialInteractionGuard(step);
  const panelPosition = useMemo(
    () => getPanelPosition(rect, step?.placement),
    [rect, step?.placement],
  );

  if (!step) return null;

  if (step.mode === 'monologue') {
    return (
      <MonologueOverlay
        step={step}
        onComplete={() => onComplete(step.id)}
        onSkip={onSkip}
        onOpenBook={onOpenBook}
      />
    );
  }

  const highlight = rect
    ? {
        left: Math.max(8, rect.left - 8),
        top: Math.max(8, rect.top - 8),
        width: Math.min(window.innerWidth - Math.max(8, rect.left - 8) - 8, rect.width + 16),
        height: Math.min(window.innerHeight - Math.max(8, rect.top - 8) - 8, rect.height + 16),
      }
    : null;

  return (
    <div className="fixed inset-0 z-[420] pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />
      {highlight && (
        <div
          className="absolute border-2 border-[#d4af37] shadow-[0_0_0_9999px_rgba(0,0,0,0.16),0_0_28px_rgba(212,175,55,0.75)]"
          style={highlight}
        >
          <div className="absolute inset-[-8px] border border-[#d4af37]/40 animate-pulse" />
        </div>
      )}

      <div
        data-tutorial-ui="true"
        className="absolute w-[min(320px,calc(100vw-32px))] border border-[#d4af37]/45 bg-[#0a0908]/95 text-[#dfd4ba] shadow-[0_25px_80px_rgba(0,0,0,0.85)] pointer-events-auto"
        style={panelPosition}
      >
        <div className="border-b border-[#d4af37]/20 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#b84235]">{step.label}</p>
            <p className="text-[9px] font-black text-[#8b8574]">{completedCount + 1}/{totalSteps}</p>
          </div>
          <h2 className="mt-1 text-lg font-black uppercase tracking-wide text-white">{step.title}</h2>
        </div>

        <div className="px-5 py-4">
          <StepBody body={step.body} />
          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              onClick={onOpenBook}
              className="flex items-center gap-2 px-2 py-2 text-[10px] font-black uppercase tracking-widest text-[#d4af37] hover:text-white"
            >
              <BookOpen size={13} />
              Book
            </button>
            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="flex h-9 w-9 items-center justify-center border border-[#8b8574]/30 text-[#8b8574] hover:text-white"
                aria-label="Skip tutorial"
              >
                <X size={15} />
              </button>
              <button
                onClick={() => onComplete(step.id)}
                className="flex items-center gap-2 bg-[#b84235] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#d65242]"
              >
                Got It
                <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
