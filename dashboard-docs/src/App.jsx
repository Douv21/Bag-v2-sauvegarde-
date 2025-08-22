import { useState, useEffect } from "react";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import './App.css'

function Dashboard() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [openCats, setOpenCats] = useState(new Set());

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}commands.json`)
      .then((res) => res.json())
      .then((json) => setData(json.dashboard));
  }, []);

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
          <a href="/settings" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">⚙️ Paramètres</a>
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
    </div>
  );
}

export default Dashboard;
