import { afterEach, beforeEach, vi } from "vitest"

import { _resetRateLimitStore } from "@/lib/rate-limit"

import { POST } from "./route"

const validBody = {
  name: "Ada",
  email: "ada@example.com",
  subject: "Hello",
  message: "This is a sufficiently long message body.",
}

function postRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "test-token"
    process.env.TELEGRAM_CHAT_ID = "test-chat"
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
      )
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    _resetRateLimitStore()
  })

  it("sends a valid payload to Telegram and returns ok", async () => {
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://api.telegram.org/bottest-token/sendMessage")
    const payload = JSON.parse(init.body)
    expect(payload.chat_id).toBe("test-chat")
    expect(payload.text).toContain("Ada")
    expect(payload.text).toContain("ada@example.com")
  })

  it("rejects an invalid payload with 400 and does not call Telegram", async () => {
    const res = await POST(postRequest({ ...validBody, email: "nope" }))
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it("returns 500 when env vars are missing", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(500)
    expect(fetch).not.toHaveBeenCalled()
  })

  it("returns 502 when Telegram delivery fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 403 }))
    )
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(502)
  })

  it("silently drops honeypot submissions (200, no Telegram)", async () => {
    const res = await POST(postRequest({ ...validBody, company: "EvilCorp" }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("returns 429 when rate limit is exceeded", async () => {
    const headers = { "x-forwarded-for": "1.2.3.4" }

    // Exhaust the budget
    for (let i = 0; i < 5; i++) {
      const res = await POST(postRequest(validBody, headers))
      expect(res.status).toBe(200)
    }

    // Next request should be blocked
    const res = await POST(postRequest(validBody, headers))
    expect(res.status).toBe(429)
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "rate limited",
    })
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(fetch).toHaveBeenCalledTimes(5)
  })

  it("silently drops too-fast submissions (time-trap)", async () => {
    const res = await POST(
      postRequest({ ...validBody, renderedAt: Date.now() - 500 })
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(fetch).not.toHaveBeenCalled()
  })

  it("uses x-real-ip when x-forwarded-for is missing", async () => {
    const headers = { "x-real-ip": "5.6.7.8" }

    // Exhaust budget for this IP
    for (let i = 0; i < 5; i++) {
      await POST(postRequest(validBody, headers))
    }

    const res = await POST(postRequest(validBody, headers))
    expect(res.status).toBe(429)
  })
})
