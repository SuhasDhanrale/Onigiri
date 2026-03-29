import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const PLATFORM_MODES = new Set([
  'development',
  'web',
  'crazygames',
  'poki',
  'gamedistribution',
  'playgama',
  'mobile'
])

const PLATFORM_OUTPUT_DIR = {
  development: 'dist',
  web: 'dist-web',
  crazygames: 'dist-crazygames',
  poki: 'dist-poki',
  gamedistribution: 'dist-gamedistribution',
  playgama: 'dist-playgama',
  mobile: 'dist-mobile'
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const platformFromMode = PLATFORM_MODES.has(mode) ? mode : 'development'
  const platform = env.VITE_PLATFORM || platformFromMode

  const isFirebaseEnabled = env.VITE_ENABLE_FIREBASE === 'true'
  const isAdsEnabled = env.VITE_ENABLE_ADS === 'true'
  const isAnalyticsEnabled = env.VITE_ENABLE_ANALYTICS === 'true'
  const isAdFree = env.VITE_AD_FREE === 'true'
  const isCrazyGamesSdkOnly = env.VITE_CG_SDK_ONLY === 'true'

  const outDir = PLATFORM_OUTPUT_DIR[platform] || `dist-${platform}`

  console.log(`[Vite] Command: ${command}`)
  console.log(`[Vite] Mode: ${mode}`)
  console.log(`[Vite] Platform: ${platform}`)
  console.log(`[Vite] Ad-free variant: ${isAdFree}`)
  console.log(`[Vite] CrazyGames SDK-only: ${isCrazyGamesSdkOnly}`)
  console.log(`[Vite] Firebase enabled: ${isFirebaseEnabled}`)
  console.log(`[Vite] Ads enabled: ${isAdsEnabled}`)
  console.log(`[Vite] Analytics enabled: ${isAnalyticsEnabled}`)

  return {
    plugins: [react()],
    base: './',

    define: {
      'import.meta.env.VITE_PLATFORM': JSON.stringify(platform),
      'import.meta.env.VITE_AD_FREE': JSON.stringify(env.VITE_AD_FREE || 'false'),
      'import.meta.env.VITE_CG_SDK_ONLY': JSON.stringify(env.VITE_CG_SDK_ONLY || 'false'),
      'import.meta.env.VITE_ENABLE_FIREBASE': JSON.stringify(env.VITE_ENABLE_FIREBASE || 'false'),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || ''),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || ''),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID || ''),
      'import.meta.env.VITE_ENABLE_ADS': JSON.stringify(env.VITE_ENABLE_ADS || 'false'),
      'import.meta.env.VITE_ENABLE_ANALYTICS': JSON.stringify(env.VITE_ENABLE_ANALYTICS || 'false'),

      'import.meta.env.VITE_GD_GAME_ID': JSON.stringify(env.VITE_GD_GAME_ID || ''),
      'import.meta.env.VITE_CG_LB_ENCRYPTION_KEY': JSON.stringify(env.VITE_CG_LB_ENCRYPTION_KEY || '')
    },

    build: {
      outDir,
      assetsDir: 'assets',
      assetsInlineLimit: 0,
      emptyOutDir: true,
      sourcemap: mode === 'development',

      rollupOptions: {
        output: {
          manualChunks: (isFirebaseEnabled || isAdsEnabled)
            ? {
                firebase: ['firebase/app', 'firebase/analytics'],
                ...(isAdsEnabled ? { ads: [] } : {})
              }
            : undefined
        },
        external: [
          ...(isFirebaseEnabled ? [] : ['firebase/app', 'firebase/analytics', 'firebase/auth', 'firebase/firestore']),
          ...(isAdsEnabled ? [] : [])
        ]
      }
    },

    server: {
      port: 3001,
      open: true,
      host: true,
      ...(mode === 'development' ? {
        headers: {
          'Cache-Control': 'no-store',
          'Clear-Site-Data': '"cache", "cookies", "storage"'
        }
      } : {})
    },

    optimizeDeps: {
      include: [
        ...(isFirebaseEnabled ? ['firebase/app', 'firebase/analytics'] : []),
        ...(isAdsEnabled ? [] : [])
      ],
      exclude: [
        ...(isFirebaseEnabled ? [] : ['firebase/app', 'firebase/analytics']),
        ...(isAdsEnabled ? [] : [])
      ]
    }
  }
})
