import { Outlet, NavLink } from 'react-router-dom'
import { Home, Sparkles, BookMarked } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-paper border-t border-ink/10 flex justify-around items-center px-4 z-50">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-coral' : 'text-ink/40 hover:text-ink/70'
            }`
          }
        >
          <Home size={20} strokeWidth={1.75} />
          <span className="font-mono text-[10px] tracking-wide">Gallery</span>
        </NavLink>

        <NavLink
          to="/create"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-coral' : 'text-ink/40 hover:text-ink/70'
            }`
          }
        >
          <Sparkles size={20} strokeWidth={1.75} />
          <span className="font-mono text-[10px] tracking-wide">Create</span>
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-coral' : 'text-ink/40 hover:text-ink/70'
            }`
          }
        >
          <BookMarked size={20} strokeWidth={1.75} />
          <span className="font-mono text-[10px] tracking-wide">Library</span>
        </NavLink>
      </nav>
    </div>
  )
}
