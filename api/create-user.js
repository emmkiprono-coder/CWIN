// ═══════════════════════════════════════════════════════════════════════
// POST /api/create-user
// Creates a real Supabase login + role profile for a new CWIN user.
//
// Security model:
//  - The powerful "service role" key lives ONLY here, on the server.
//    It is never sent to the browser and never appears in App.jsx.
//  - Only a caller who is already signed in AND already has role
//    'owner' or 'admin' may use this endpoint (checked below).
//
// Required environment variables (set in Vercel → Settings →
// Environment Variables — never pasted into code):
//   SUPABASE_URL          (same project URL the app already uses)
//   SB_SERVICE_ROLE_KEY   (Supabase → Settings → API → Secret keys)
// ═══════════════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://okvyhbypncctevvtwqkf.supabase.co";
const SERVICE_KEY = process.env.SB_SERVICE_ROLE_KEY;

const VALID_ROLES = ["owner", "admin", "caregiver", "client", "family"];

function randomPassword(len = 14) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
    return out;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
          res.status(405).json({ error: "Method not allowed" });
          return;
    }
    if (!SERVICE_KEY) {
          res.status(500).json({
                  error: "Server not configured: SB_SERVICE_ROLE_KEY is missing. Add it in Vercel → Settings → Environment Variables.",
          });
          return;
    }

  // 1) Identify the caller from their Supabase session token
  const authHeader = req.headers.authorization || "";
    const callerToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!callerToken) {
          res.status(401).json({ error: "Missing authorization token. Sign in and try again." });
          return;
    }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: callerData, error: callerErr } = await admin.auth.getUser(callerToken);
    if (callerErr || !callerData?.user) {
          res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
          return;
    }

  // 2) Confirm the caller is an owner or admin — this is the entire
  //    access-control gate for this endpoint.
  const { data: callerProfile, error: profileErr } = await admin
      .from("user_profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .single();

  if (profileErr || !callerProfile || !["owner", "admin"].includes(callerProfile.role)) {
        res.status(403).json({ error: "Only an owner or admin can create user accounts." });
        return;
  }

  // 3) Validate the request body
  const { email, role, name, caregiverId, clientId } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
          res.status(400).json({ error: "A valid email is required." });
          return;
    }
    if (!VALID_ROLES.includes(role)) {
          res.status(400).json({ error: "role must be one of: " + VALID_ROLES.join(", ") });
          return;
    }

  // 4) Create the Supabase Auth account with a generated temporary password
  const tempPassword = randomPassword();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true, // no confirmation email needed — account is usable immediately
    });

  if (createErr) {
        const msg = /already registered|already exists/i.test(createErr.message || "")
          ? "An account with that email already exists."
                : createErr.message || "Failed to create the account.";
        res.status(400).json({ error: msg });
        return;
  }

  // 5) Create their role profile so the app knows who they are on first sign-in
  const { error: insertErr } = await admin.from("user_profiles").insert({
        id: created.user.id,
        email,
        name: name || email,
        role,
        caregiver_id: caregiverId || null,
        client_id: clientId || null,
  });

  if (insertErr) {
        res.status(500).json({
                error: "Account was created but the role could not be assigned: " + insertErr.message,
                email,
        });
        return;
  }

  res.status(200).json({
        success: true,
        email,
        role,
        tempPassword,
        note: "Share this password with the person directly (text or call) — not email. Ask them to change it after they sign in.",
  });
}
