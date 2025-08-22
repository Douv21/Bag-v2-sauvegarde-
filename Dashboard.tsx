"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader as DialogHeaderRoot, DialogTitle as DialogTitleRoot, DialogTrigger } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

type Category = {
  icon: string
  title: string
  desc: string
  slug: string
}

const categories: Category[] = [
  { icon: "🛡️", title: "Modération", desc: "Gérer les utilisateurs et sécuriser ton serveur", slug: "moderation" },
  { icon: "💰", title: "Économie", desc: "Système de monnaie, karma et boutique", slug: "economie" },
  { icon: "📈", title: "Level", desc: "Système d’XP et cartes personnalisées", slug: "level" },
  { icon: "🤫", title: "Confessions", desc: "Envoyer et gérer des confessions anonymes", slug: "confessions" },
  { icon: "🎮", title: "AouV", desc: "Ajouter, modifier ou supprimer prompts et channels", slug: "aouv" },
  { icon: "✅", title: "Vérification utilisateur", desc: "Automatiser la vérification et les quarantaines", slug: "verification-utilisateur" },
  { icon: "📜", title: "Logs", desc: "Suivre les événements du serveur", slug: "logs" },
  { icon: "🧵", title: "AutoThread", desc: "Créer automatiquement des threads", slug: "autothread" },
  { icon: "🔢", title: "Comptage", desc: "Système de comptage et mini-jeux mathématiques", slug: "comptage" },
]

const categorySubmenus: Record<string, Array<{ name: string; description?: string }>> = {
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

type GuildMetadata = {
  roles: Array<{ id: string; name: string }>
  channels: Array<{ id: string; name: string; type?: string }>
}

type SubmenuItem = { name: string; description?: string }

const LINKS = {
  invite: "#",
  support: "#",
  settings: "/dashboard/settings",
}

export default function Dashboard() {
  const searchParams = useSearchParams()
  const guildId = useMemo(() => searchParams.get("guildId") || "", [searchParams])
  const apiBase = useMemo(
    () => ((process.env.NEXT_PUBLIC_BAG_API_BASE_URL as string | undefined) || "").replace(/\/$/, ""),
    []
  )

  const [metadata, setMetadata] = useState<GuildMetadata | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [submenus, setSubmenus] = useState<Record<string, { loading: boolean; items: SubmenuItem[]; error?: string }>>({})

  useEffect(() => {
    if (!guildId) return
    let cancelled = false
    async function load() {
      try {
        setMetaLoading(true)
        setMetaError(null)
        const metadataUrl = apiBase
          ? `${apiBase}/guilds/${guildId}/metadata`
          : `/api/guilds/${guildId}/metadata`
        const res = await fetch(metadataUrl, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as GuildMetadata
        if (!cancelled) setMetadata(data)
      } catch (err: unknown) {
        if (!cancelled) setMetaError("Impossible de charger les rôles et salons")
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [guildId, apiBase])

  const loadSubmenus = async (slug: string) => {
    const current = submenus[slug]
    if (current?.loading || (current && current.items.length > 0)) return
    setSubmenus((s) => ({ ...s, [slug]: { loading: true, items: [], error: undefined } }))
    try {
      const url = apiBase ? `${apiBase}/dashboard/${slug}/commands` : `/api/dashboard/${slug}/commands`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const items = (await res.json()) as SubmenuItem[]
      setSubmenus((s) => ({ ...s, [slug]: { loading: false, items } }))
    } catch (e) {
      setSubmenus((s) => ({ ...s, [slug]: { loading: false, items: [], error: "Chargement des sous‑menus impossible" } }))
    }
  }

  const stopCardNavigation = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image src="https://cdn.discordapp.com/attachments/1408458115283812484/1408458115770482778/20250305162902.png?ex=68a9d056&is=68a87ed6&hm=3189c1bb0c0b3b9dd3d818ea9608a9d9088d3fef798c36f920d60d64eef998e0&" alt="BAG Logo" width={36} height={36} className="rounded" unoptimized />
            <span className="font-semibold tracking-tight">BAG</span>
          </div>
          <nav className="hidden gap-2 sm:flex">
            <Button asChild variant="secondary">
              <a href={LINKS.invite} target="_blank" rel="noreferrer">Inviter le bot</a>
            </Button>
            <Button asChild variant="outline">
              <a href={LINKS.support} target="_blank" rel="noreferrer">Support</a>
            </Button>
            <Button asChild>
              <Link href={LINKS.settings}>Paramètres</Link>
            </Button>
          </nav>
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Ouvrir le menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Image src="https://cdn.discordapp.com/attachments/1408458115283812484/1408458115770482778/20250305162902.png?ex=68a9d056&is=68a87ed6&hm=3189c1bb0c0b3b9dd3d818ea9608a9d9088d3fef798c36f920d60d64eef998e0&" alt="BAG Logo" width={20} height={20} className="rounded" unoptimized />
                    <span>BAG</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid gap-2">
                  <Button asChild variant="secondary" className="justify-start">
                    <a href={LINKS.invite} target="_blank" rel="noreferrer">Inviter le bot</a>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <a href={LINKS.support} target="_blank" rel="noreferrer">Support</a>
                  </Button>
                  <Button asChild className="justify-start">
                    <Link href={LINKS.settings}>Paramètres</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_-10%,rgba(120,119,198,0.15),transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="flex flex-col items-center text-center">
            <Image src="https://cdn.discordapp.com/attachments/1408458115283812484/1408458115770482778/20250305162902.png?ex=68a9d056&is=68a87ed6&hm=3189c1bb0c0b3b9dd3d818ea9608a9d9088d3fef798c36f920d60d64eef998e0&" alt="BAG Logo" width={96} height={96} className="mb-4 rounded" unoptimized />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">BAG Dashboard</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Administration et documentation centrales
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:hidden">
              <Button asChild variant="secondary">
                <a href={LINKS.invite} target="_blank" rel="noreferrer">Inviter le bot</a>
              </Button>
              <Button asChild variant="outline">
                <a href={LINKS.support} target="_blank" rel="noreferrer">Support</a>
              </Button>
              <Button asChild>
                <Link href={LINKS.settings}>Paramètres</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Server metadata: roles & channels */}
      <section className="mx-auto w-full max-w-6xl px-4 py-6">
        {!guildId ? (
          <Card className="border border-border/60 bg-card/60">
            <CardHeader>
              <CardTitle className="text-base">Métadonnées serveur</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ajoute <code className="rounded bg-muted px-1 py-0.5">?guildId=TON_ID</code> à l’URL pour afficher les noms de rôles et de salons.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Rôles</CardTitle>
              </CardHeader>
              <CardContent>
                {metaLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : metaError ? (
                  <p className="text-sm text-red-500">{metaError}</p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto pr-2">
                    {metadata?.roles?.length ? (
                      metadata.roles.slice(0, 24).map((r) => (
                        <li key={r.id} className="truncate text-sm text-muted-foreground">{r.name}</li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">Aucun rôle trouvé</li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card className="border border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Salons</CardTitle>
              </CardHeader>
              <CardContent>
                {metaLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : metaError ? (
                  <p className="text-sm text-red-500">{metaError}</p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto pr-2">
                    {metadata?.channels?.length ? (
                      metadata.channels.slice(0, 24).map((c) => (
                        <li key={c.id} className="truncate text-sm text-muted-foreground">{c.name}</li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">Aucun salon trouvé</li>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Categories Grid */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/dashboard/${cat.slug}`}
              aria-label={`${cat.title} – ouvrir`}
              className="group block h-full"
            >
              <Card className="relative h-full overflow-hidden border border-border/60 bg-card/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card/80">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-base">
                      {cat.icon}
                    </span>
                    <span className="truncate">{cat.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{cat.desc}</p>
                  <div className="mt-4">
                    <Dialog onOpenChange={(open) => { if (open) loadSubmenus(cat.slug) }}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-0 text-primary" onClick={stopCardNavigation}>
                          Voir les commandes →
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeaderRoot>
                          <DialogTitleRoot>{cat.title} – Commandes</DialogTitleRoot>
                          <DialogDescription>
                            Accède rapidement aux sous‑menus et commandes disponibles.
                          </DialogDescription>
                        </DialogHeaderRoot>
                        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-2">
                          {submenus[cat.slug]?.loading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                            </div>
                          ) : submenus[cat.slug]?.error ? (
                            <div className="text-sm text-red-500">{submenus[cat.slug]?.error}</div>
                          ) : (
                            <> 
                              { (submenus[cat.slug]?.items?.length ? submenus[cat.slug]!.items : (categorySubmenus[cat.slug] || []))
                                .map((item, idx) => (
                                  <div key={idx} className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                                    <div className="font-medium">{item.name}</div>
                                    {item.description ? (
                                      <div className="text-muted-foreground">{item.description}</div>
                                    ) : null}
                                  </div>
                                ))}
                              {!(submenus[cat.slug]?.items?.length || (categorySubmenus[cat.slug] || []).length) ? (
                                <div className="text-sm text-muted-foreground">Aucun sous‑menu défini pour le moment.</div>
                              ) : null}
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="https://cdn.discordapp.com/attachments/1408458115283812484/1408458115770482778/20250305162902.png?ex=68a9d056&is=68a87ed6&hm=3189c1bb0c0b3b9dd3d818ea9608a9d9088d3fef798c36f920d60d64eef998e0&" alt="BAG Logo" width={20} height={20} className="rounded" unoptimized />
            <span>BAG</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={LINKS.invite} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">Inviter le bot</a>
            <a href={LINKS.support} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">Support</a>
            <span className="text-xs text-muted-foreground">v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}