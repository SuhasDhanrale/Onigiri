// Dev-only entry that wires the Mock Lab shell to Onigiri's registry +
// presets. Never imported from production code; run with `npm run dev:mocks`.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MockWorkbench } from './MockWorkbench.jsx';
import { mockScreens } from './registry.jsx';
import { metaPresets } from './presets.js';
import '../styles/base.css';
import '../styles/combat.css';
import '../styles/panels.css';
import '../index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MockWorkbench
      registry={mockScreens}
      presets={metaPresets}
      branding={{ title: 'MOCK LAB', subtitle: 'Experiments for Onigiri.' }}
    />
  </StrictMode>,
);
