// POST /api/update-user
// Lets an owner/admin edit another user's name and/or login email.
//
// Security model: same as create-user.js -- the service role key stays
// only on the server, and the caller must already be signed in with
// role owner/admin (checked below) before anything changes.
//
// Required environment variables (already set for create-user.js):
//   SB_PROJECT_URL
//   SB_SERVICE_ROLE_KEY
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SB_PROJECT_URL || "https://okvyhbypncctevvtwqkf.supabase.co";
const SERVICE_KEY = process.env.SB_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== "POST") {
          res.status(405).json({ error: "Method not allowed" });
          return;
    }
    if (!SERVICE_KEY) {
          res.status(500).json({ error: "Server not configured: SB_SERVICE_ROLE_KEY is missing." });
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
          res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
          return;
    }

  const { data: callerProfile, error: profileErr } = await admin
      .from("user_profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .single();

  if (profileErr || !callerProfile || !["owner", "admin"].includes(callerProfile.role)) {
        res.status(403).json({ error: "Only an owner or admin can edit user accounts." });
        return;
  }

  const { targetId, email, name } = req.body || {};
    if (!targetId) {
          res.status(400).json({ error: "targetId is required." });
          return;
    }
    if (!email && !name) {
          res.status(400).json({ error: "Nothing to update." });
          return;
    }
    if (email && (typeof email !== "string" || !email.includes("@"))) {
          res.status(400).json({ error: "A valid email is required." });
          return;
    }

  if (email) {
        const { error: authUpdateErr } = await admin.auth.admin.updateUserById(targetId, { email });
        if (authUpdateErr) {
                const msg = /already registered|already exists/i.test(authUpdateErr.message || "")
                  ? "Another account already uses that email."
                          : authUpdateErr.message || "Failed to update the login email.";
                res.status(400).json({ error: msg });
                return;
        }
  }

  const updates = {};
    if (email) updates.email = email;
    if (name) updates.name = name;

  const { error: profileUpdateErr } = await admin
      .from("user_profiles")
      .update(updates)
      .eq("id", targetId);

  if (profileUpdateErr) {
        res.status(500).json({
                error: "Login updated but the profile record could not be saved: " + profileUpdateErr.message,
        });
        return;
  }

  res.status(200).json({ success: true, targetId, email: email || null, name: name || null });
}
