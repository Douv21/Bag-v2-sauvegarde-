import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/commands.json").then(r => r.json()).then(json => setData(json.dashboard));
  }, []);

  if (!data) return <div className="p-6">Chargement…</div>;

  return (
    <section className="p-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {data.categories.map((cat, i) => (
        <a key={i} href={cat.link}
           className="bg-gray-800 rounded-2xl p-6 shadow hover:shadow-lg hover:-translate-y-0.5 transition">
          <h2 className="text-xl font-bold mb-2">{cat.icon} {cat.name}</h2>
          <p className="text-gray-400 mb-4">{cat.description}</p>
          <span className="inline-block px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700">
            Voir les commandes →
          </span>
        </a>
      ))}
    </section>
  );
}