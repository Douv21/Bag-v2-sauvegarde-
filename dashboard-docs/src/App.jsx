import { useEffect, useMemo, useState } from 'react'
import './App.css'

function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

function useCommandsData() {
  const [data, setData] = useState({ categories: [], settings: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}commands.json`)
      .then((r) => {
        if (!r.ok) throw new Error('Erreur chargement JSON')
        return r.json()
      })
      .then((json) => {
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}

function MobileTopBar({ categories, active, onSelect, onOpenMenu }) {
  return (
    <div className="md:hidden sticky top-0 z-20 bg-neutral-900/80 backdrop-blur border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        <button aria-label="Menu" onClick={onOpenMenu} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5"><path d="M3.75 6.75h16.5v1.5H3.75zM3.75 11.25h16.5v1.5H3.75zM3.75 15.75h16.5v1.5H3.75z"/></svg>
          <span className="text-sm">Catégories</span>
        </button>
        <div className="text-sm text-white/70">{active ?? 'Toutes'}</div>
      </div>
    </div>
  )
}

function Sidebar({ categories, active, onSelect }) {
  return (
    <aside className="hidden md:block w-64 shrink-0 h-dvh sticky top-0 overflow-y-auto border-r border-white/10 bg-neutral-950/60">
      <div className="p-4">
        <h2 className="text-white/80 font-semibold mb-3">Catégories</h2>
        <nav className="space-y-1">
          <button onClick={() => onSelect(null)} className={classNames('w-full text-left px-3 py-2 rounded-md text-sm', active == null ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5')}>Toutes</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => onSelect(cat)} className={classNames('w-full text-left px-3 py-2 rounded-md text-sm', active === cat ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5')}>{cat}</button>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10" />
          <button onClick={() => onSelect('__settings')} className={classNames('w-full text-left px-3 py-2 rounded-md text-sm', active === '__settings' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5')}>Paramètres serveur</button>
        </nav>
      </div>
    </aside>
  )
}

function DiscordEmbed({ title, children }) {
  return (
    <div className="rounded-lg border border-[#1f2226] bg-[#2b2d31]">
      <div className="border-l-4 border-[#5865F2] rounded-l-lg p-4">
        <div className="text-[#cfd4db] font-semibold mb-1">{title}</div>
        <div className="text-white/80 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function CommandCard({ command }) {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{command.name}</h3>
          <p className="text-sm text-white/70">{command.description}</p>
        </div>
      </div>
      <div className="mt-3">
        <DiscordEmbed title="Usage">
          <code className="text-white/90 bg-white/10 px-1.5 py-0.5 rounded">{command.usage}</code>
        </DiscordEmbed>
      </div>
      {command.example ? (
        <div className="mt-3">
          <DiscordEmbed title="Exemple">
            <code className="text-white/90 bg-white/10 px-1.5 py-0.5 rounded">{command.example}</code>
          </DiscordEmbed>
        </div>
      ) : null}
    </div>
  )
}

function SettingsSection({ settings }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-white">Paramètres du serveur</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(settings).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-neutral-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-white/50">{k}</div>
            <div className="text-white mt-1 break-words">{Array.isArray(v) ? v.join(', ') : String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MainContent({ activeCategory, categories, settings }) {
  if (activeCategory === '__settings') {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <SettingsSection settings={settings} />
      </div>
    )
  }

  const commands = useMemo(() => {
    const list = []
    categories.forEach((cat) => {
      if (activeCategory == null || activeCategory === cat.name) {
        cat.commands.forEach((cmd) => list.push({ ...cmd, _category: cat.name }))
      }
    })
    return list
  }, [categories, activeCategory])

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-white">Commandes {activeCategory ? `· ${activeCategory}` : ''}</h1>
      </div>
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {commands.map((c) => (
          <CommandCard key={`${c._category}-${c.name}`} command={c} />
        ))}
      </div>
      <div className="md:hidden space-y-3">
        {commands.map((c) => (
          <CommandCard key={`${c._category}-${c.name}`} command={c} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { data, loading, error } = useCommandsData()
  const [activeCategory, setActiveCategory] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const categoryNames = useMemo(() => data.categories.map((c) => c.name), [data])

  useEffect(() => {
    if (!activeCategory && categoryNames.length > 0) {
      // default to all
      setActiveCategory(null)
    }
  }, [categoryNames, activeCategory])

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center text-white/70">Chargement…</div>
    )
  }
  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center text-red-400">Erreur: {String(error.message || error)}</div>
    )
  }

  return (
    <div className="min-h-dvh text-white">
      <MobileTopBar categories={categoryNames} active={activeCategory} onSelect={setActiveCategory} onOpenMenu={() => setMobileOpen(true)} />
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <Sidebar categories={categoryNames} active={activeCategory} onSelect={(v) => { setActiveCategory(v); setMobileOpen(false) }} />
        <main>
          <MainContent activeCategory={activeCategory} categories={data.categories} settings={data.settings} />
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-neutral-950 border-r border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white/80 font-semibold">Catégories</h2>
              <button aria-label="Fermer" onClick={() => setMobileOpen(false)} className="p-2 rounded-md hover:bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5"><path d="m6.225 4.811 12.964 12.964-1.414 1.414L4.811 6.225z"/><path d="M19.189 6.225 6.225 19.189l-1.414-1.414L17.775 4.811z"/></svg>
              </button>
            </div>
            <nav className="space-y-1">
              <button onClick={() => { setActiveCategory(null); setMobileOpen(false) }} className={classNames('w-full text-left px-3 py-2 rounded-md text-sm', activeCategory == null ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5')}>Toutes</button>
              {categoryNames.map((cat) => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setMobileOpen(false) }} className={classNames('w-full text-left px-3 py-2 rounded-md text-sm', activeCategory === cat ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5')}>{cat}</button>
              ))}
              <div className="pt-4 mt-4 border-t border-white/10" />
              <button onClick={() => { setActiveCategory('__settings'); setMobileOpen(false) }} className={classNames('w-full text-left px-3 py-2 rounded-md text-sm', activeCategory === '__settings' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5')}>Paramètres serveur</button>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  )
}
