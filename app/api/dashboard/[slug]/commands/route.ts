import { NextRequest, NextResponse } from "next/server"

export const revalidate = 0

const fallback: Record<string, Array<{ name: string; description?: string }>> = {
  moderation: [
    { name: "/ban", description: "Bannir un utilisateur" },
    { name: "/kick", description: "Expulser un utilisateur" },
    { name: "/mute", description: "Rendre muet un utilisateur" },
  ],
  economie: [
    { name: "/balance", description: "Voir le solde" },
    { name: "/daily", description: "Récompense quotidienne" },
    { name: "/shop", description: "Accéder à la boutique" },
  ],
  level: [
    { name: "/rank", description: "Voir sa carte d'XP" },
    { name: "/leaderboard", description: "Classement du serveur" },
  ],
  confessions: [
    { name: "/confess", description: "Envoyer une confession anonyme" },
    { name: "/confess-manage", description: "Gérer les confessions" },
  ],
  aouv: [
    { name: "/prompt-add", description: "Ajouter un prompt" },
    { name: "/prompt-list", description: "Lister les prompts" },
  ],
  "verification-utilisateur": [
    { name: "/verify-setup", description: "Configurer la vérification" },
    { name: "/quarantine", description: "Gérer les quarantaines" },
  ],
  logs: [
    { name: "/logs-setup", description: "Configurer les logs" },
  ],
  autothread: [
    { name: "/autothread-enable", description: "Activer l'AutoThread" },
  ],
  comptage: [
    { name: "/count-setup", description: "Configurer le comptage" },
    { name: "/math", description: "Jouer aux mini-jeux" },
  ],
}

export async function GET(request: NextRequest, context: { params: { slug: string } }) {
  const { slug } = context.params
  const apiBase = (process.env.BAG_API_BASE_URL || "").replace(/\/$/, "")
  const token = process.env.BAG_API_TOKEN

  try {
    if (apiBase) {
      const url = `${apiBase}/dashboard/${encodeURIComponent(slug)}/commands`
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })
      if (!res.ok) {
        return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: 502 })
      }
      const items = await res.json()
      return NextResponse.json(items)
    }

    return NextResponse.json(fallback[slug] || [])
  } catch (e) {
    return NextResponse.json({ error: "Unhandled server error" }, { status: 500 })
  }
}