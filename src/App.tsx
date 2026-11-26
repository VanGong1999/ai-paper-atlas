import { Navigate, Route, Routes } from 'react-router-dom'
import { TopBar } from './components/layout/TopBar'
import { HomePage } from './pages/HomePage'
import { LibraryDetailPage } from './pages/LibraryDetailPage'
import { LibraryPage } from './pages/LibraryPage'
import { PaperRouter } from './pages/PaperRouter'

export default function App() {
  return (
    <div className="app-shell">
      <div className="grain" aria-hidden />
      <TopBar />
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
