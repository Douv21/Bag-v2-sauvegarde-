import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import './App.css'

function Dashboard() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}commands.json`)
      .then((res) => res.json())
      .then((json) => setData(json.dashboard));
  }, []);

  if (!data) return <div className="text-white p-6">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <img src={data.logo} alt="BAG Logo" className="w-12 h-12 rounded-full" />
          <h1 className="text-2xl font-bold">BAG Dashboard</h1>
        </div>
        <div className="hidden md:flex space-x-4">
          <a href="/invite" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700">➕ Inviter le bot</a>
          <a href="/support" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">❓ Support</a>
          <a href="/settings" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">⚙️ Paramètres</a>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* MENU MOBILE */}
      {open && (
        <nav className="md:hidden bg-gray-800 p-4 space-y-2">
          {data.categories.map((cat, idx) => (
            <a
              key={idx}
              href={cat.link}
              className="block px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
            >
              {cat.icon} {cat.name}
            </a>
          ))}
        </nav>
      )}

      <div className="flex flex-1">
        {/* SIDEBAR PC */}
        <aside className="hidden md:flex flex-col w-60 bg-gray-800 border-r border-gray-700 p-4 space-y-2">
          {data.categories.map((cat, idx) => (
            <a
              key={idx}
              href={cat.link}
              className="px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </a>
          ))}
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
            >
              <h2 className="text-xl font-bold mb-2">
                {cat.icon} {cat.name}
              </h2>
              <p className="text-gray-400 mb-4">{cat.description}</p>
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
