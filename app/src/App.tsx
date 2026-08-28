import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { ChampionPage } from './pages/ChampionPage'
import { GuideDetailPage } from './pages/GuideDetailPage'
import { HomePage } from './pages/HomePage'
import { MinePage } from './pages/MinePage'
import { PublishPage } from './pages/PublishPage'
import { SearchPage } from './pages/SearchPage'
import { WebGuidePage } from './pages/WebGuidePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/publish" element={<PublishPage />} />
        <Route path="/mine" element={<MinePage />} />
        <Route path="/champion/:id" element={<ChampionPage />} />
        <Route path="/guide/:id" element={<GuideDetailPage />} />
        <Route path="/web/:queryKey" element={<WebGuidePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
