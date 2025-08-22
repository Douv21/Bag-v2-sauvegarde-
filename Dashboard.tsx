"use client"

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

type GenericConfig = Record<string, any>
type ConfigState = { loading: boolean; data: GenericConfig | null; error?: string; saving?: boolean; savedAt?: number }

const LOGO_URL = "https://cdn.discordapp.com/attachments/1408458115283812484/1408458115770482778/20250305162902.png?ex=68a9d056&is=68a87ed6&hm=3189c1bb0c0b3b9dd3d818ea9608a9d9088d3fef798c36f920d60d64eef998e0&"

function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  const [src, setSrc] = useState<string>(LOGO_URL)
  return (
    // native <img> for robust fallback; Discord CDN sometimes blocks referers or expires
    <img
      src={src}
      alt="BAG Logo"
      width={size}
      height={size}
      className={`rounded ${className}`}
      referrerPolicy="no-referrer"
      onError={() => setSrc("/bag-fallback.svg")}
    />
  )
}

const LINKS = {
  invite: "https://discord.com/oauth2/authorize?client_id=1394318358228369538&permissions=8&integration_type=0&scope=bot",
  support: "https://discord.gg/W52qQtNqFt",
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
  const [configs, setConfigs] = useState<Record<string, ConfigState>>({})

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

  const getConfigUrl = (slug: string) => (apiBase ? `${apiBase}/dashboard/${slug}/config` : `/api/dashboard/${slug}/config`)

  const loadConfig = async (slug: string) => {
    const existing = configs[slug]
    if (existing?.loading || existing?.data) return
    setConfigs((c) => ({ ...c, [slug]: { loading: true, data: null, error: undefined } }))
    try {
      const res = await fetch(getConfigUrl(slug), { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as GenericConfig
      setConfigs((c) => ({ ...c, [slug]: { loading: false, data } }))
    } catch (err) {
      setConfigs((c) => ({ ...c, [slug]: { loading: false, data: null, error: "Impossible de charger la configuration" } }))
    }
  }

  const updateConfigField = (slug: string, key: string, value: any) => {
    setConfigs((c) => {
      const prev = c[slug]
      const data = { ...(prev?.data || {}), [key]: value }
      return { ...c, [slug]: { ...(prev || { loading: false }), data } }
    })
  }

  const saveConfig = async (slug: string) => {
    const current = configs[slug]
    if (!current?.data || current.saving) return
    setConfigs((c) => ({ ...c, [slug]: { ...current, saving: true, error: undefined } }))
    try {
      const res = await fetch(getConfigUrl(slug), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current.data),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setConfigs((c) => ({ ...c, [slug]: { ...c[slug]!, saving: false, savedAt: Date.now() } }))
    } catch (err) {
      setConfigs((c) => ({ ...c, [slug]: { ...c[slug]!, saving: false, error: "Échec de la sauvegarde" } }))
    }
  }

  const stopCardNavigation = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const withGuild = (path: string) => (guildId ? `${path}${path.includes("?") ? "&" : "?"}guildId=${guildId}` : path)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
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
              <Link href={withGuild(LINKS.settings)}>Paramètres</Link>
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
                    <Logo size={20} />
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
                    <Link href={withGuild(LINKS.settings)}>Paramètres</Link>
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
            <Logo size={96} className="mb-4" />
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
                <Link href={withGuild(LINKS.settings)}>Paramètres</Link>
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
              href={withGuild(`/dashboard/${cat.slug}`)}
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
                    <Dialog onOpenChange={(open) => { if (open) { loadConfig(cat.slug) } }}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-0 text-primary" onClick={stopCardNavigation}>
                          Voir la configuration →
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeaderRoot>
                          <DialogTitleRoot>{cat.title} – Configuration</DialogTitleRoot>
                          <DialogDescription>
                            Modifie la configuration de ce module. Un aperçu est affiché lorsque c’est possible.
                          </DialogDescription>
                        </DialogHeaderRoot>
                        <div className="mt-2 max-h-[70vh] overflow-y-auto pr-2">
                          {configs[cat.slug]?.loading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</div>
                          ) : configs[cat.slug]?.error ? (
                            <div className="text-sm text-red-500">{configs[cat.slug]?.error}</div>
                          ) : (
                            <div className="grid gap-4">
                              {/* Formulaire généré automatiquement */}
                              <div className="grid gap-3">
                                {Object.entries(configs[cat.slug]?.data || {}).map(([key, val]) => {
                                  const lower = key.toLowerCase()
                                  const isBool = typeof val === "boolean"
                                  const isNum = typeof val === "number"
                                  const isStr = typeof val === "string"
                                  const isColor = isStr && /(color|couleur)/i.test(key)
                                  const isImage = isStr && /(image|logo|banner|url)/i.test(key)
                                  const isRoleLike = isStr && /(role|roleid)/i.test(lower)
                                  const isChannelLike = isStr && /(channel|salon|channelid)/i.test(lower)
                                  const isPrimitive = isBool || isNum || isStr
                                  return (
                                    <div key={key} className="grid gap-1.5">
                                      <label className="text-sm font-medium">{key}</label>
                                      {isBool ? (
                                        <label className="inline-flex items-center gap-2 text-sm">
                                          <input
                                            type="checkbox"
                                            className="h-4 w-4"
                                            checked={!!val}
                                            onChange={(e) => updateConfigField(cat.slug, key, e.target.checked)}
                                          />
                                          <span className="text-muted-foreground">{val ? "Activé" : "Désactivé"}</span>
                                        </label>
                                      ) : isNum ? (
                                        <input
                                          type="number"
                                          className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                                          value={Number.isFinite(val) ? val : 0}
                                          onChange={(e) => updateConfigField(cat.slug, key, Number(e.target.value))}
                                        />
                                      ) : isColor ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="color"
                                            className="h-8 w-10 cursor-pointer rounded-md border border-border/60 bg-muted/20"
                                            value={(val as string) || "#000000"}
                                            onChange={(e) => updateConfigField(cat.slug, key, e.target.value)}
                                          />
                                          <input
                                            type="text"
                                            className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                                            value={val as string}
                                            onChange={(e) => updateConfigField(cat.slug, key, e.target.value)}
                                          />
                                        </div>
                                      ) : isChannelLike && metadata?.channels?.length ? (
                                        <select
                                          className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                                          value={val as string}
                                          onChange={(e) => updateConfigField(cat.slug, key, e.target.value)}
                                        >
                                          <option value="">— choisir un salon —</option>
                                          {metadata.channels.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                          ))}
                                        </select>
                                      ) : isRoleLike && metadata?.roles?.length ? (
                                        <select
                                          className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                                          value={val as string}
                                          onChange={(e) => updateConfigField(cat.slug, key, e.target.value)}
                                        >
                                          <option value="">— choisir un rôle —</option>
                                          {metadata.roles.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                          ))}
                                        </select>
                                      ) : isImage ? (
                                        <div className="grid gap-2">
                                          <input
                                            type="url"
                                            className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                                            value={val as string}
                                            onChange={(e) => updateConfigField(cat.slug, key, e.target.value)}
                                            placeholder="https://…"
                                          />
                                          {(val as string)?.trim() ? (
                                            <img
                                              src={val as string}
                                              alt={key}
                                              className="max-h-40 w-auto rounded-md border border-border/60 bg-muted/10 object-contain"
                                              referrerPolicy="no-referrer"
                                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/bag-fallback.svg" }}
                                            />
                                          ) : null}
                                        </div>
                                      ) : isStr ? (
                                        <input
                                          type="text"
                                          className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                                          value={val as string}
                                          onChange={(e) => updateConfigField(cat.slug, key, e.target.value)}
                                        />
                                      ) : (
                                        <textarea
                                          className="min-h-[84px] w-full rounded-md border border-border/60 bg-background px-2 py-1 text-sm"
                                          value={(() => { try { return JSON.stringify(val, null, 2) } catch { return String(val) } })()}
                                          onChange={(e) => {
                                            try {
                                              const next = JSON.parse(e.target.value)
                                              updateConfigField(cat.slug, key, next)
                                            } catch {
                                              // keep as text until valid JSON
                                            }
                                          }}
                                        />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Aperçu simple basé sur quelques clés usuelles */}
                              <div className="grid gap-2">
                                <div className="text-sm font-medium">Aperçu</div>
                                <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="h-6 w-6 rounded"
                                      style={{
                                        background:
                                          (configs[cat.slug]?.data?.primaryColor as string) ||
                                          (configs[cat.slug]?.data?.color as string) ||
                                          (configs[cat.slug]?.data?.couleur as string) ||
                                          "#6b7280",
                                      }}
                                    />
                                    <div className="text-sm text-muted-foreground">
                                      {(configs[cat.slug]?.data?.title as string) || `${cat.title}`}
                                    </div>
                                  </div>
                                  {(() => {
                                    const img =
                                      (configs[cat.slug]?.data?.image as string) ||
                                      (configs[cat.slug]?.data?.logo as string) ||
                                      (configs[cat.slug]?.data?.banner as string)
                                    if (!img) return null
                                    return (
                                      <div className="mt-2">
                                        <img
                                          src={img}
                                          alt="preview"
                                          className="max-h-40 w-auto rounded-md border border-border/60 bg-muted/10 object-contain"
                                          referrerPolicy="no-referrer"
                                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/bag-fallback.svg" }}
                                        />
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="mt-2 flex items-center justify-end gap-3">
                                {configs[cat.slug]?.savedAt ? (
                                  <span className="text-xs text-muted-foreground">Sauvegardé</span>
                                ) : null}
                                <Button
                                  onClick={() => saveConfig(cat.slug)}
                                  disabled={configs[cat.slug]?.saving}
                                >
                                  {configs[cat.slug]?.saving ? "Sauvegarde…" : "Enregistrer"}
                                </Button>
                              </div>
                            </div>
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
            <Logo size={20} />
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