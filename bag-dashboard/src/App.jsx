import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  const [nav, setNav] = useState([]);
  const [logo, setLogo] = useState("/bag-logo.png");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/commands.json")
      .then((r) => r.json())
      .then((json) => {
        setLogo(json.dashboard?.logo || "/bag-logo.png");
        setNav(json.dashboard?.categories || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between gap-3 p-4 border-b border-gray-800 bg-gray-850/50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="BAG Logo" className="w-10 h-10 rounded-full" />
          <h1 className="text-xl md:text-2xl font-bold">BAG Dashboard</h1>
        </div>
        <nav className="hidden md:flex items-center gap-2">
          <a href="/invite" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700">Inviter le bot</a>
          <a href="/support" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Support</a>
          <a href="/settings" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Paramètres</a>
        </nav>
        <button className="md:hidden text-2xl" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
      </header>

      {/* NAV MOBILE */}
      {open && (
        <div className="md:hidden border-b border-gray-800 bg-gray-900">
          <div className="p-3 grid grid-cols-2 gap-2">
            {nav.map((c, i) => (
              <NavLink
                key={i}
                to={c.link}
                className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                onClick={() => setOpen(false)}
              >
                {c.icon} {c.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 p-4 border-r border-gray-800 bg-gray-900">
          {nav.map((c, i) => (
            <NavLink
              key={i}
              to={c.link}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 ${
                  isActive ? "bg-gray-800" : ""
                }`
              }
            >
              <span>{c.icon}</span><span>{c.name}</span>
            </NavLink>
          ))}
        </aside>

        {/* CONTENU */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* FOOTER */}
      <footer className="p-4 border-t border-gray-800 text-center text-gray-400">
        BAG Bot • © {new Date().getFullYear()} • <a href="/support" className="hover:text-white">Support</a>
      </footer>
    </div>
  );
}
