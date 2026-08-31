// ════════════════════════════════════════════════════════════════════════════════
// POST /api/ai-agent
// Proxies CWIN's built-in AI agents (note expansion, staffing insights,
// dispatcher suggestions, wage/pricing analysis, etc.) to the Anthropic
// API. The API key lives ONLY here on the server — it is never sent to
// the browser, so it stays safe even though App.jsx is public source.
//
// Required environment variable (set in Vercel → Settings →
// Environment Variables — never pasted into code):
//   ANTHROPIC_API_KEY
// ════════════════════════════════════════════════════════════════════════════════
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS_CAP = 4000; // cost guard — no single call can request more than this

export default async function handler(req, res) {
    if (req.method !== "POST") {
          res.status(405).json({ error: "Method not allowed" });
          return;
    }
    if (!ANTHROPIC_KEY) {
          res.status(500).json({
                  error: "Server not configured: ANTHROPIC_API_KEY is missing. Add it in Vercel → Settings → Environment Variables.",
          });
          return;
    }

  const { model, max_tokens, messages, system } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
          res.status(400).json({ error: "messages array is required" });
          return;
    }

  const cappedTokens = Math.max(1, Math.min(Number(max_tokens) || 1000, MAX_TOKENS_CAP));

  try {
        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                          "Content-Type": "application/json",
                          "x-api-key": ANTHROPIC_KEY,
                          "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                          model: model || DEFAULT_MODEL,
                          max_tokens: cappedTokens,
                          messages,
                          ...(system ? { system } : {}),
                }),
        });

      const data = await upstream.json();
        res.status(upstream.status).json(data);
  } catch (e) {
        res.status(502).json({ error: "Could not reach the AI service: " + e.message });
  }
}
