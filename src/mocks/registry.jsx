// Each experiment is ITS OWN file under `screens/`; registering it is a
// single entry appended here. Additive — never edit an existing experiment to
// make a new one. See AGENTS.md for the full recipe + entry contract.
import { BattlefieldMock, BattlefieldControls } from './screens/BattlefieldMock.jsx';
import { CliffMock, CliffControls } from './screens/CliffMock.jsx';
import { HomeMock } from './screens/HomeMock.jsx';
import { DemonsMock } from './screens/DemonsMock.jsx';
import { BossAnimMock } from './screens/BossAnimMock.jsx';
import { BaseMock, BaseControls } from './screens/BaseMock.jsx';
import { MusicMock } from './screens/MusicMock.jsx';
import { EffectsMock } from './screens/EffectsMock.jsx';

export const mockScreens = [
  {
    id: 'boss_anim',
    title: 'Boss Animation Viewer',
    description: 'Procedural top-down silhouette animation viewer for bosses.',
    component: BossAnimMock,
  },
  {
    id: 'demons',
    title: 'Demon Compendium',
    description: 'Showcase of the 5 Oni Bosses and their mechanics.',
    component: DemonsMock,
  },
  {
    id: 'home',
    title: 'Home Screen',
    description: 'Title screen with Play button and Chapter selection.',
    component: HomeMock,
  },
  {
    id: 'cliff_tuning',
    title: 'Cliff Tuning',
    description: 'Isolated playground for framing the battlefield rocks.',
    component: CliffMock,
    initialState: { leftEdge: 60, rightEdge: 1140 },
    controls: CliffControls,
  },
  {
    id: 'battlefield',
    title: 'Battlefield',
    description: 'Real renderer + unit roster at real V_WIDTH x V_HEIGHT coords.',
    component: BattlefieldMock,
    defaultPresetId: 'starter',
    initialState: { mode: 'skirmish' },
    controls: BattlefieldControls,
  },
  {
    id: 'player_base',
    title: 'Player Base',
    description: 'Visualization of the 4 barracks and bamboo wall from 3/4 back view.',
    component: BaseMock,
    initialState: { wallType: 'bamboo' },
    controls: BaseControls,
  },
  {
    id: 'music_engine',
    title: 'Music Engine',
    description: 'Procedural Web Audio API synthesis for game tracks.',
    component: MusicMock,
  },
  {
    id: 'effects_library',
    title: 'VFX Library',
    description: 'Pure SVG and CSS animations for combat special effects.',
    component: EffectsMock,
  },
];
