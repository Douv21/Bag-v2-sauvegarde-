import { NextRequest, NextResponse } from "next/server"

export const revalidate = 0

// In-memory store as fallback (development only)
const globalAny = globalThis as unknown as { __bagSettings?: Record<string, any> }
if (!globalAny.__bagSettings) globalAny.__bagSettings = {}

export async function GET(request: NextRequest) {
  const apiBase = (process.env.BAG_API_BASE_URL || "").replace(/\/$/, "")
  const token = process.env.BAG_API_TOKEN
  const { searchParams } = new URL(request.url)
  const guildId = searchParams.get("guildId") || "default"

  try {
    if (apiBase) {
      const res = await fetch(`${apiBase}/dashboard/settings?guildId=${encodeURIComponent(guildId)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })
      if (!res.ok) return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    const data = globalAny.__bagSettings![guildId] || {
      moderationEnabled: true,
      economyEnabled: true,
      logChannelId: null as string | null,
      modRoleId: null as string | null,
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "Unhandled server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const apiBase = (process.env.BAG_API_BASE_URL || "").replace(/\/$/, "")
  const token = process.env.BAG_API_TOKEN
  const { searchParams } = new URL(request.url)
  const guildId = searchParams.get("guildId") || "default"

  try {
    const body = await request.json()

    if (apiBase) {
      const res = await fetch(`${apiBase}/dashboard/settings?guildId=${encodeURIComponent(guildId)}`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      })
      if (!res.ok) return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: 502 })
      const data = await res.json()
      return NextResponse.json(data)
    }

    globalAny.__bagSettings![guildId] = {
      moderationEnabled: Boolean(body.moderationEnabled),
      economyEnabled: Boolean(body.economyEnabled),
      logChannelId: body.logChannelId ?? null,
      modRoleId: body.modRoleId ?? null,
    }
    return NextResponse.json(globalAny.__bagSettings![guildId])
  } catch (e) {
    return NextResponse.json({ error: "Unhandled server error" }, { status: 500 })
  }
}