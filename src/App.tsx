import { useLayoutEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { TopBar } from './components/layout/TopBar'
import { HomePage } from './pages/HomePage'
import { LibraryDetailPage } from './pages/LibraryDetailPage'
import { LibraryPage } from './pages/LibraryPage'
import { PaperRouter } from './pages/PaperRouter'

type Theme = 'light' | 'dark'

const themeStorageKey = 'orbit-theme'

function readTheme(): Theme {
  try {
    return window.localStorage.getItem(themeStorageKey) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export default function App() {
  const [theme, setTheme] = useState(readTheme)

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      window.localStorage.setItem(themeStorageKey, theme)
    } catch {
      // The current theme still applies when browser storage is unavailable.
    }
  }, [theme])

  return (
    <div className="app-shell">
      <div className="grain" aria-hidden />
      <div className="app-header">
        <TopBar />
        <button
          type="button"
          className="chip theme-toggle"
          aria-label="亮色主题"
          aria-pressed={theme === 'light'}
          onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
        >
          亮色
        </button>
      </div>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:id" element={<LibraryDetailPage />} />
          <Route path="/papers/:slug" element={<PaperRouter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
