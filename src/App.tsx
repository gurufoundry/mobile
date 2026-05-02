import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Create from './pages/Create'
import StickerDetail from './pages/StickerDetail'
import StickerAudio from './pages/StickerAudio'
import Library from './pages/Library'
import Play from './pages/Play'
import PresetDetail from './pages/PresetDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no nav shell */}
        <Route path="/play/:id" element={<Play />} />
        <Route path="/auth" element={<Auth />} />

        {/* App routes — with bottom-tab nav */}
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<Create />} />
          <Route path="/sticker/:id" element={<StickerDetail />} />
          <Route path="/sticker/:id/audio" element={<StickerAudio />} />
          <Route path="/library" element={<Library />} />
          <Route path="/preset/:id" element={<PresetDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
