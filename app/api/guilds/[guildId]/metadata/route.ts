import { NextRequest, NextResponse } from "next/server"

export const revalidate = 0

export async function GET(request: NextRequest, context: { params: { guildId: string } }) {
  const { guildId } = context.params
  const apiBase = (process.env.BAG_API_BASE_URL || "").replace(/\/$/, "")
  const token = process.env.BAG_API_TOKEN

  try {
    if (apiBase) {
      const url = `${apiBase}/guilds/${encodeURIComponent(guildId)}/metadata`
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
      const data = await res.json()
      return NextResponse.json(data)
    }

    // Fallback sample
    return NextResponse.json({
      roles: [
        { id: "1", name: "Admin" },
        { id: "2", name: "Modérateur" },
        { id: "3", name: "Membre" },
      ],
      channels: [
        { id: "10", name: "général", type: "text" },
        { id: "11", name: "logs", type: "text" },
        { id: "12", name: "vocal-1", type: "voice" },
      ],
    })
  } catch (e) {
    return NextResponse.json({ error: "Unhandled server error" }, { status: 500 })
  }
}