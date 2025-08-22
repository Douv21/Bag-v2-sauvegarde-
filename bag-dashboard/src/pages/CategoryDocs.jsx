import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function CategoryDocs() {
  const { categorie } = useParams();
  const [cat, setCat] = useState(null);

  useEffect(() => {
    fetch("/commands.json")
      .then(r => r.json())
      .then(json => setCat(json.categories.find(c => c.slug === categorie)));
  }, [categorie]);

  if (!cat) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{cat.name} — Commandes</h1>
        <Link to="/dashboard" className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700">← Dashboard</Link>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {cat.commands.map((cmd, i) => (
          <article key={i} className="bg-gray-800 rounded-2xl p-6 shadow">
            <h2 className="text-lg font-bold">{cmd.name}</h2>
            <p className="text-gray-400 mt-1">{cmd.description}</p>
            {cmd.usage && (
              <p className="text-sm text-gray-300 mt-2">
                <span className="opacity-70">Usage :</span> <code>{cmd.usage}</code>
              </p>
            )}
            {cmd.example && (
              <div className="mt-4 bg-gray-700/70 rounded-lg border-l-4 border-red-600 p-3">
                <p className="text-sm text-gray-200">{cmd.example}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}