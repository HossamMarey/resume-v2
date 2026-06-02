import { NextResponse } from "next/server"

import { rateLimit } from "@/lib/rate-limit"
import { contactSchema } from "@/lib/schemas/contact"

const TELEGRAM_API = "https://api.telegram.org"
const FALLBACK_IP = "unknown"

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const firstHop = forwarded.split(",")[0]?.trim()
    if (firstHop) return firstHop
  }

  const realIP = request.headers.get("x-real-ip")
  if (realIP) return realIP

  return FALLBACK_IP
}

function buildMessage(data: {
  name: string
  email: string
  subject?: string
  message: string
}): string {
  return [
    "📨 New contact message",
    `From: ${data.name} <${data.email}>`,
    data.subject ? `Subject: ${data.subject}` : null,
    "",
    data.message,
  ]
    .filter((line) => line !== null)
    .join("\n")
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 }
    )
  }

  // Honeypot: silently drop if filled (bot prevention)
  const honeypot = body.company
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return NextResponse.json({ ok: true })
  }

  // Optional time-trap: drop if submitted too fast (<1500ms)
  const renderedAt = body.renderedAt
  if (typeof renderedAt === "number" && Date.now() - renderedAt < 1500) {
    return NextResponse.json({ ok: true })
  }

  // Rate limiting
  const ip = getClientIP(request)
  const limitResult = rateLimit(ip, { limit: 5, windowMs: 600_000 })
  if (!limitResult.ok) {
    const retryAfter = Math.ceil((limitResult.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { ok: false, error: "rate limited" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    )
  }

  // Validate with Zod
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Server-only — these MUST NOT be prefixed with NEXT_PUBLIC_, or the bot
  // token gets inlined into the client bundle and is readable by anyone.
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, error: "server misconfigured" },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(parsed.data),
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "delivery failed" },
        { status: 502 }
      )
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "delivery failed" },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
