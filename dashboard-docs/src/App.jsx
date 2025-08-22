import { useState, useEffect } from "react";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import './App.css'

function Dashboard() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [openCats, setOpenCats] = useState(new Set());
  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ prefix: '!', autoroles: [], logs: '', security_level: 'Élevé' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSavedAt, setSettingsSavedAt] = useState(0);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}commands.json`)
      .then((res) => res.json())
      .then((json) => setData(json.dashboard));
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    // Load settings from API, fallback to commands.json defaults
    (async () => {
      try {
        setSettingsLoading(true);
        const res = await fetch('/api/config/dashboard-settings');
        const json = await res.json().catch(() => ({ success: false }));
        if (json && json.success && json.data) {
          const d = json.data;
          setSettings({
            prefix: typeof d.prefix === 'string' ? d.prefix : (data?.settings?.prefix ?? '!'),
            autoroles: Array.isArray(d.autoroles) ? d.autoroles : (data?.settings?.autoroles ?? []),
            logs: typeof d.logs === 'string' ? d.logs : (data?.settings?.logs ?? ''),
            security_level: typeof d.security_level === 'string' ? d.security_level : (data?.settings?.security_level ?? 'Élevé')
          });
        } else {
          setSettings({
            prefix: data?.settings?.prefix ?? '!',
            autoroles: data?.settings?.autoroles ?? [],
            logs: data?.settings?.logs ?? '',
            security_level: data?.settings?.security_level ?? 'Élevé'
          });
        }
      } catch {
        setSettings({
          prefix: data?.settings?.prefix ?? '!',
          autoroles: data?.settings?.autoroles ?? [],
          logs: data?.settings?.logs ?? '',
          security_level: data?.settings?.security_level ?? 'Élevé'
        });
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, [settingsOpen, data]);

  if (!data) return <div className="text-white p-6">Chargement...</div>;

  const hasChildren = (cat) => Array.isArray(cat.children) && cat.children.length > 0;
  const toggleCat = (idx) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };
  const onLogoError = (e) => {
    const img = e.currentTarget;
    if (img.dataset.fallback !== '1') {
      img.src = '/logo-bag-premium.svg';
      img.dataset.fallback = '1';
    }
  };
  const saveSettings = async () => {
    try {
      setSettingsSaving(true);
      const res = await fetch('/api/config/dashboard-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json && json.success) {
        setSettingsSavedAt(Date.now());
      }
    } catch {
      // ignore
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/90 backdrop-blur">
        <div className="flex items-center space-x-3">
          <img src={data.logo} alt="BAG Logo" className="w-12 h-12 rounded-full" onError={onLogoError} />
          <div>
            <h1 className="text-2xl font-bold leading-tight">BAG Dashboard</h1>
            <p className="text-gray-400 text-sm">Administration et documentation centrales</p>
          </div>
        </div>
        <div className="hidden md:flex space-x-4">
          <a href="/invite" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700">➕ Inviter le bot</a>
          <a href="/support" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">❓ Support</a>
          <button type="button" onClick={() => setSettingsOpen(true)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">⚙️ Paramètres</button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* MENU MOBILE */}
      {open && (
        <nav id="mobile-nav" className="md:hidden bg-gray-800 p-4 space-y-2 border-b border-gray-700">
          {data.categories.map((cat, idx) => (
            <div key={idx} className="rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <a
                  href={cat.link}
                  className="flex-1 px-4 py-2 rounded-l-lg hover:bg-gray-700"
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                </a>
                {hasChildren(cat) && (
                  <button
                    className="px-3 py-2 rounded-r-lg hover:bg-gray-700"
                    aria-expanded={openCats.has(idx)}
                    aria-controls={`sub-mobile-${idx}`}
                    onClick={(e) => { e.preventDefault(); toggleCat(idx); }}
                  >
                    {openCats.has(idx) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                )}
              </div>
              {hasChildren(cat) && openCats.has(idx) && (
                <div id={`sub-mobile-${idx}`} className="px-4 pb-3 space-y-1 bg-gray-800">
                  {cat.children.map((child, cidx) => (
                    <a
                      key={cidx}
                      href={child.link}
                      className="block pl-6 pr-3 py-1.5 text-sm rounded-md hover:bg-gray-700/80"
                    >
                      <span className="mr-2">{child.icon}</span>
                      {child.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex flex-1">
        {/* SIDEBAR PC */}
        <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700 p-4 space-y-1">
          {data.categories.map((cat, idx) => (
            <div key={idx} className="">
              <div className="flex items-center">
                <a
                  href={cat.link}
                  className="flex-1 px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </a>
                {hasChildren(cat) && (
                  <button
                    className="ml-2 p-1 rounded-md hover:bg-gray-700"
                    aria-expanded={openCats.has(idx)}
                    aria-controls={`sub-desktop-${idx}`}
                    onClick={(e) => { e.preventDefault(); toggleCat(idx); }}
                    title={openCats.has(idx) ? 'Replier' : 'Déplier'}
                  >
                    {openCats.has(idx) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {hasChildren(cat) && openCats.has(idx) && (
                <div id={`sub-desktop-${idx}`} className="mt-1 ml-6 space-y-1">
                  {cat.children.map((child, cidx) => (
                    <a
                      key={cidx}
                      href={child.link}
                      className="block px-3 py-1.5 text-sm rounded-md hover:bg-gray-700/80"
                    >
                      <span className="mr-2">{child.icon}</span>
                      {child.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:ring-1 hover:ring-red-600/50 transition"
            >
              <h2 className="text-xl font-bold mb-2">
                {cat.icon} {cat.name}
              </h2>
              <p className="text-gray-400 mb-4">{cat.description}</p>
              {hasChildren(cat) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {cat.children.slice(0, 4).map((child, cidx) => (
                    <a key={cidx} href={child.link} className="text-xs px-2 py-1 rounded-full bg-gray-700 hover:bg-gray-600">
                      <span className="mr-1">{child.icon}</span>
                      {child.name}
                    </a>
                  ))}
                </div>
              )}
              <a
                href={cat.link}
                className="inline-block px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
              >
                Voir les commandes →
              </a>
            </div>
          ))}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="p-4 bg-gray-800 border-t border-gray-700 text-center text-gray-400">
        <p>BAG Bot • Version 2.0.0 • <a href="/support" className="hover:text-white">Support</a></p>
      </footer>

      {/* SETTINGS PANEL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSettingsOpen(false)}></div>
          <div className="relative w-full md:max-w-2xl bg-gray-900 border border-gray-700 rounded-t-2xl md:rounded-2xl p-6 m-0 md:m-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Paramètres du dashboard</h2>
              <button className="text-gray-400 hover:text-white" onClick={() => setSettingsOpen(false)}>✖</button>
            </div>

            {settingsLoading ? (
              <div className="text-gray-400">Chargement des paramètres…</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Préfixe</label>
                  <input
                    type="text"
                    value={settings.prefix}
                    onChange={(e) => setSettings(s => ({ ...s, prefix: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Autoroles (séparés par des virgules)</label>
                  <input
                    type="text"
                    value={settings.autoroles.join(', ')}
                    onChange={(e) => setSettings(s => ({ ...s, autoroles: e.target.value.split(',').map(v => v.trim()).filter(Boolean) }))}
                    className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Salon de logs</label>
                  <input
                    type="text"
                    value={settings.logs}
                    onChange={(e) => setSettings(s => ({ ...s, logs: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="#logs"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Niveau de sécurité</label>
                  <select
                    value={settings.security_level}
                    onChange={(e) => setSettings(s => ({ ...s, security_level: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option>Bas</option>
                    <option>Moyen</option>
                    <option>Élevé</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {settingsSavedAt ? `Enregistré à ${new Date(settingsSavedAt).toLocaleTimeString()}` : '—'}
                  </div>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={settingsSaving}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {settingsSaving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
