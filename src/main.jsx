import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/combat.css'
import './styles/panels.css'
import './index.css'
import App from './App.jsx'
import { bootCrazyGamesSdk } from './platforms/crazygamesSdk.js'
import { LocalizationProvider } from './i18n/LocalizationProvider.jsx'

async function main() {
  const platformSdkBooted = await bootCrazyGamesSdk()

  if (import.meta.env.VITE_ENABLE_ADS === 'true' && !platformSdkBooted) {
    try {
      const { AdManager } = await import('../ads/AdManager.js')
      await AdManager.init()
    } catch (error) {
      console.warn('[Ads] Initialization failed', error)
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LocalizationProvider>
        <App />
      </LocalizationProvider>
    </StrictMode>,
  )
}

main()
