// POST /api/update-user
// Lets an owner/admin edit another user's name, login email, and which
// caregiver/client record they're linked to.
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

  const { targetId, email, name, caregiverId, clientId } = req.body || {};
      if (!targetId) {
              res.status(400).json({ error: "targetId is required." });
              return;
      }
      const hasEmail = typeof email === "string" && email.length > 0;
      const hasName = typeof name === "string" && name.length > 0;
      const hasCaregiverId = caregiverId !== undefined;
      const hasClientId = clientId !== undefined;
      if (!hasEmail && !hasName && !hasCaregiverId && !hasClientId) {
              res.status(400).json({ error: "Nothing to update." });
              return;
      }
      if (hasEmail && !email.includes("@")) {
              res.status(400).json({ error: "A valid email is required." });
              return;
      }

  if (hasEmail) {
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
      if (hasEmail) updates.email = email;
      if (hasName) updates.name = name;
      if (hasCaregiverId) updates.caregiver_id = caregiverId || null;
      if (hasClientId) updates.client_id = clientId || null;

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

  res.status(200).json({
          success: true,
          targetId,
          email: hasEmail ? email : null,
          name: hasName ? name : null,
          caregiverId: hasCaregiverId ? caregiverId : undefined,
          clientId: hasClientId ? clientId : undefined,
  });
}
