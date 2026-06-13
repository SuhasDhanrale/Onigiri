import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/combat.css'
import './styles/panels.css'
import './index.css'
import App from './App.jsx'
import { bootCrazyGamesSdkOnly } from './platforms/crazygamesSdk.js'

async function main() {
  await bootCrazyGamesSdkOnly()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

main()
