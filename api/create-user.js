// POST /api/create-user (DIAGNOSTIC BUILD - includes _diag field for debugging)
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
                        error: "Server not configured: SB_SERVICE_ROLE_KEY is missing.",
                        _diag: "SERVICE_KEY env var not set or empty",
              });
              return;
      }

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
              res.status(401).json({
                        error: "Invalid or expired session. Please sign in again.",
                        _diag: {
                                    hasCallerErr: !!callerErr,
                                    errMessage: callerErr?.message || null,
                                    errStatus: callerErr?.status || null,
                                    errName: callerErr?.name || null,
                                    errCode: callerErr?.code || null,
                                    keyPrefix: SERVICE_KEY ? SERVICE_KEY.slice(0, 12) : null,
                                    keyLen: SERVICE_KEY ? SERVICE_KEY.length : 0,
                                    supabaseUrl: SUPABASE_URL,
                        },
              });
              return;
      }

  const { data: callerProfile, error: profileErr } = await admin
        .from("user_profiles")
        .select("role")
        .eq("id", callerData.user.id)
        .single();

  if (profileErr || !callerProfile || !["owner", "admin"].includes(callerProfile.role)) {
          res.status(403).json({
                    error: "Only an owner or admin can create user accounts.",
                    _diag: { profileErr: profileErr?.message || null, callerProfile },
          });
          return;
  }

  const { email, role, name, caregiverId, clientId } = req.body || {};
      if (!email || typeof email !== "string" || !email.includes("@")) {
              res.status(400).json({ error: "A valid email is required." });
              return;
      }
      if (!VALID_ROLES.includes(role)) {
              res.status(400).json({ error: "role must be one of: " + VALID_ROLES.join(", ") });
              return;
      }

  const tempPassword = randomPassword();
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true,
      });

  if (createErr) {
          const msg = /already registered|already exists/i.test(createErr.message || "")
            ? "An account with that email already exists."
                    : createErr.message || "Failed to create the account.";
          res.status(400).json({ error: msg });
          return;
  }

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
