"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

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

const LINKS = {
  invite: "#",
  support: "#",
  settings: "/dashboard/settings",
}

export default function Dashboard() {
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
                    <Button variant="link" className="px-0 text-primary transition-colors group-hover:text-primary">
                      Voir les commandes →
                    </Button>
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