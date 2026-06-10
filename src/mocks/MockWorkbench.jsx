import { useMemo, useState } from 'react';
import { FlaskConical, Maximize2, PanelLeft, RefreshCcw, Smartphone, TabletSmartphone } from 'lucide-react';

// Default device viewports. Override or extend by passing a `viewports` prop.
export const DEFAULT_VIEWPORTS = [
  { id: 'phone', label: 'Phone', icon: Smartphone, width: 400, height: 700 },
  { id: 'tall', label: 'Tall', icon: TabletSmartphone, width: 390, height: 844 },
  { id: 'compact', label: 'Compact', icon: Smartphone, width: 360, height: 640 },
  { id: 'wide', label: 'Wide', icon: Maximize2, width: 900, height: 700 },
];

const DEFAULT_BRANDING = {
  title: 'MOCK LAB',
  subtitle: 'Isolated screen experiments.',
  accent: '#feca57',
  deviceBg: '#ffffff',
};

/**
 * Game-agnostic Mock Lab shell. The game injects ALL content via props — the
 * shell hard-imports no screens, no presets, nothing game-specific. Copy this
 * file into a game's `src/mocks/`; never fork it to add a screen.
 *
 *   <MockWorkbench registry={mockScreens} presets={metaPresets} branding={...} />
 *
 * registry entry contract:
 *   { id, title, description, component,
 *     defaultPresetId?, initialState?, controls? }
 *   - component(props) receives { presetId, resetToken, state, setState }
 *   - controls(ctx)    optional per-screen toolbar slot; ctx = { state, setState, reset }
 *     (this is how screen-specific chrome — e.g. a BAKERY/CANDIES tab — is added
 *      WITHOUT editing the shell)
 *
 * preset contract: { id, label, note?, create() }
 *   create() returns a GAME-STATE-SHAPED object (fidelity = clean promotion).
 */
export const MockWorkbench = ({
  registry,
  presets = [],
  viewports = DEFAULT_VIEWPORTS,
  branding,
}) => {
  const brand = { ...DEFAULT_BRANDING, ...branding };
  const [screenId, setScreenId] = useState(registry[0].id);
  const selectedScreen = useMemo(
    () => registry.find((screen) => screen.id === screenId) || registry[0],
    [registry, screenId],
  );
  const [presetId, setPresetId] = useState(selectedScreen.defaultPresetId);
  const [viewportId, setViewportId] = useState(viewports[0].id);
  const [resetToken, setResetToken] = useState(0);
  const [screenState, setScreenState] = useState(selectedScreen.initialState ?? {});

  const viewport = viewports.find((item) => item.id === viewportId) || viewports[0];
  const ActiveMock = selectedScreen.component;
  const bumpReset = () => setResetToken((value) => value + 1);

  const selectScreen = (nextScreen) => {
    setScreenId(nextScreen.id);
    setPresetId(nextScreen.defaultPresetId);
    setScreenState(nextScreen.initialState ?? {});
    bumpReset();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#202636] text-white">
      <div className="grid h-full grid-cols-[280px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#2f3548]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2" style={{ color: brand.accent }}>
              <FlaskConical size={20} strokeWidth={3} />
              <h1 className="text-[16px] font-black tracking-widest">{brand.title}</h1>
            </div>
            <p className="mt-1 text-[11px] font-bold leading-snug text-white/55">
              {brand.subtitle}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-black tracking-widest text-white/45">
              <PanelLeft size={13} />
              SCREENS
            </div>

            <div className="space-y-2">
              {registry.map((screen) => {
                const isActive = screen.id === selectedScreen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => selectScreen(screen)}
                    className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${isActive ? 'bg-[#54a0ff] text-white shadow-sm' : 'bg-white/5 text-white/75 hover:bg-white/10'}`}
                  >
                    <span className="block text-[13px] font-black tracking-wide">{screen.title}</span>
                    <span className="mt-1 block text-[10px] font-bold leading-snug opacity-75">{screen.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {presets.length > 0 && (
            <div className="border-t border-white/10 p-4">
              <label className="mb-1 block text-[10px] font-black tracking-widest text-white/45" htmlFor="mock-preset">
                PRESET
              </label>
              <select
                id="mock-preset"
                value={presetId}
                onChange={(event) => {
                  setPresetId(event.target.value);
                  bumpReset();
                }}
                className="w-full rounded-lg border border-white/10 bg-[#202636] px-3 py-2 text-[12px] font-black text-white outline-none"
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
              </select>

              <button
                onClick={bumpReset}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1dd1a1] px-3 py-2 text-[12px] font-black tracking-widest text-white shadow-sm transition-transform active:translate-y-0.5"
              >
                <RefreshCcw size={15} strokeWidth={3} />
                RESET
              </button>
            </div>
          )}
        </aside>

        <main className="flex min-w-0 flex-col">
          <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/10 bg-[#262d3d] px-5">
            <div>
              <h2 className="text-[15px] font-black tracking-widest">{selectedScreen.title.toUpperCase()}</h2>
              <p className="text-[10px] font-bold text-white/45">Edit mocks in src/mocks, promote only what works.</p>
            </div>

            <div className="flex items-center gap-2">
              {selectedScreen.controls && (
                <div className="mr-2">
                  {selectedScreen.controls({ state: screenState, setState: setScreenState, reset: bumpReset })}
                </div>
              )}

              <div className="flex rounded-lg bg-white/10 p-1">
                {viewports.map((item) => {
                  const Icon = item.icon;
                  const isActive = viewport.id === item.id;
                  return (
                    <button
                      key={item.id}
                      title={`${item.label} ${item.width}x${item.height}`}
                      onClick={() => setViewportId(item.id)}
                      className={`flex h-8 w-9 items-center justify-center rounded-md ${isActive ? 'bg-white text-[#202636]' : 'text-white/60 hover:text-white'}`}
                    >
                      {Icon ? <Icon size={16} strokeWidth={3} /> : item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-auto bg-[#202636]">
            <div className="flex min-h-full items-center justify-center p-8">
              <div
                className="relative overflow-hidden border-[10px] border-white shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
                style={{
                  width: viewport.width,
                  height: viewport.height,
                  borderRadius: viewport.id === 'wide' ? 18 : 30,
                  background: brand.deviceBg,
                }}
              >
                <ActiveMock
                  presetId={presetId}
                  resetToken={resetToken}
                  state={screenState}
                  setState={setScreenState}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
