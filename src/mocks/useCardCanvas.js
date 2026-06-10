import { useEffect, useLayoutEffect, useRef } from 'react';

// Small rAF rig for canvas mocks. Maps a fixed LOGICAL game-space (whatever
// coords your real renderers draw in) onto whatever CSS size the canvas ends up
// at — uniform scale + centering, so circles stay circles on any viewport. This
// is the key to fidelity: drive a mock canvas through your game's REAL renderers
// in their REAL coordinate space, so promoting the screen is a move, not a port.
//
// The draw callback receives:
//   ctx       — already transformed into logical coords (draw at your real CX/CY)
//   t         — seconds since mount (drive loops off this)
//   dtFrames  — elapsed time in 60fps frame-units (advance any renderTime by this,
//               matching a typical game loop's dt convention), clamped to avoid jumps.
export const useCardCanvas = (draw, { logicalW = 400, logicalH = 460 } = {}) => {
  const canvasRef = useRef(null);
  const drawRef = useRef(draw);
  // Keep the latest draw fn without retriggering the rAF effect.
  useLayoutEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const cssW = canvas.clientWidth || logicalW;
      const cssH = canvas.clientHeight || logicalH;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let start = null;
    let last = null;

    const frame = (ts) => {
      if (start === null) start = ts;
      const t = (ts - start) / 1000;
      const dtFrames = last === null ? 1 : Math.min(3, ((ts - last) / 1000) * 60);
      last = ts;

      // Uniform fit of the logical box into the backing store, centered.
      const s = Math.min(canvas.width / logicalW, canvas.height / logicalH);
      const offX = (canvas.width - logicalW * s) / 2;
      const offY = (canvas.height - logicalH * s) / 2;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(s, 0, 0, s, offX, offY);

      drawRef.current(ctx, t, dtFrames);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [logicalW, logicalH]);

  return canvasRef;
};
