// Each experiment is ITS OWN file under `screens/`; registering it is a
// single entry appended here. Additive — never edit an existing experiment to
// make a new one. See AGENTS.md for the full recipe + entry contract.
import { BattlefieldMock, BattlefieldControls } from './screens/BattlefieldMock.jsx';

export const mockScreens = [
  {
    id: 'battlefield',
    title: 'Battlefield',
    description: 'Real renderer + unit roster at real V_WIDTH x V_HEIGHT coords.',
    component: BattlefieldMock,
    defaultPresetId: 'starter',
    initialState: { mode: 'skirmish' },
    controls: BattlefieldControls,
  },
];
