import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useStore } from './lib/store'
import { applySettings } from './lib/theme'

// Apply persisted settings before the first paint (theme, fonts, motion).
try {
  applySettings(useStore.getState().settings)
} catch {
  // corrupted/settings edge case — fall back to defaults rather than crashing
  applySettings(useStore.getState().settings)
}
document.title = 'NEXUS'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
