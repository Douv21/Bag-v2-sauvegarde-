"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

type GuildMetadata = {
  roles: Array<{ id: string; name: string }>
  channels: Array<{ id: string; name: string; type?: string }>
}

type Settings = {
  moderationEnabled: boolean
  economyEnabled: boolean
  logChannelId: string | null
  modRoleId: string | null
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const guildId = useMemo(() => searchParams.get("guildId") || "", [searchParams])

  const [metadata, setMetadata] = useState<GuildMetadata | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)

  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [mRes, sRes] = await Promise.all([
          guildId ? fetch(`/api/guilds/${guildId}/metadata`, { cache: "no-store" }) : Promise.resolve(null as any),
          fetch(`/api/dashboard/settings?guildId=${encodeURIComponent(guildId || "default")}`, { cache: "no-store" }),
        ])
        if (mRes) {
          if (!mRes.ok) throw new Error("meta")
          const m = (await mRes.json()) as GuildMetadata
          if (!cancelled) setMetadata(m)
        }
        if (!sRes.ok) throw new Error("settings")
        const s = (await sRes.json()) as Settings
        if (!cancelled) setSettings(s)
      } catch (e) {
        if (!cancelled) setError("Impossible de charger les paramètres")
      } finally {
        if (!cancelled) {
          setLoading(false)
          setMetaLoading(false)
        }
      }
    }
    setMetaLoading(true)
    load()
    return () => {
      cancelled = true
    }
  }, [guildId])

  const handleSave = async () => {
    if (!settings) return
    try {
      setSaving(true)
      setSaved(false)
      setError(null)
      const res = await fetch(`/api/dashboard/settings?guildId=${encodeURIComponent(guildId || "default")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
    } catch (e) {
      setError("Échec de l’enregistrement")
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Paramètres</h1>
          <Button asChild variant="outline" size="sm">
            <Link href={guildId ? `/dashboard?guildId=${guildId}` : "/dashboard"}>Retour</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : settings ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Général</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="mod">Modération</Label>
                    <p className="text-xs text-muted-foreground">Active les fonctionnalités de modération</p>
                  </div>
                  <Switch id="mod" checked={settings.moderationEnabled} onCheckedChange={(v) => setSettings({ ...settings, moderationEnabled: v })} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="eco">Économie</Label>
                    <p className="text-xs text-muted-foreground">Système de monnaie et boutique</p>
                  </div>
                  <Switch id="eco" checked={settings.economyEnabled} onCheckedChange={(v) => setSettings({ ...settings, economyEnabled: v })} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/60">
              <CardHeader>
                <CardTitle className="text-base">Intégrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Salon des logs</Label>
                  <Select value={settings.logChannelId ?? ""} onValueChange={(v) => setSettings({ ...settings, logChannelId: v || null })}>
                    <SelectTrigger>
                      <SelectValue placeholder={metaLoading ? "Chargement…" : "Choisir un salon"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(metadata?.channels || []).filter((c) => !c.type || c.type === "text").map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rôle modérateur</Label>
                  <Select value={settings.modRoleId ?? ""} onValueChange={(v) => setSettings({ ...settings, modRoleId: v || null })}>
                    <SelectTrigger>
                      <SelectValue placeholder={metaLoading ? "Chargement…" : "Choisir un rôle"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(metadata?.roles || []).map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving || !settings}>
            {saving ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</span>) : "Enregistrer"}
          </Button>
          {saved ? <span className="text-sm text-muted-foreground">Enregistré ✔</span> : null}
        </div>
      </main>
    </div>
  )
}