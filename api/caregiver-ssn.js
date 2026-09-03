// POST /api/caregiver-ssn
// Stores and retrieves caregiver Social Security Numbers -- the most
// sensitive field in the whole app. Handled deliberately differently
// from every other field:
//
//  - SSNs are NEVER stored in caregivers_store (the normal record).
//    They live in their own table, encrypted, that has Row Level
//    Security enabled with ZERO policies -- meaning the public/browser
//    key can never read or write it under any circumstance. Only this
//    server function (using the service role key) can touch it.
//  - The value is encrypted with AES-256-GCM before it's ever written
//    to the database, using a key that lives only in this server's
//    environment variables -- never in the browser, never in the repo.
//  - Only a caller already signed in as owner/admin may use this
//    endpoint at all (checked below, same pattern as create-user.js).
//  - Reading the full number back ("reveal") is a separate, explicit
//    action from checking whether one is on file -- so the UI never
//    fetches a plaintext SSN unless a human deliberately clicks Reveal.
//
// Required environment variables (SB_* already set for create-user.js):
//   SB_PROJECT_URL
//   SB_SERVICE_ROLE_KEY
//   SSN_ENCRYPTION_KEY   -- a 32-byte key, base64-encoded.
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SB_PROJECT_URL || "https://okvyhbypncctevvtwqkf.supabase.co";
const SERVICE_KEY = process.env.SB_SERVICE_ROLE_KEY;
const ENC_KEY_B64 = process.env.SSN_ENCRYPTION_KEY;

function getKey() {
    if (!ENC_KEY_B64) return null;
  try {
    const buf = Buffer.from(ENC_KEY_B64, "base64");
    return buf.length === 32 ? buf : null;
  } catch (e) {
    return null;
  }
}

function encrypt(plainText, key) {
    const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(payloadB64, key) {
    const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
}
  if (!SERVICE_KEY) {
    res.status(500).json({ error: "Server not configured: SB_SERVICE_ROLE_KEY is missing." });
    return;
  }
  const key = getKey();
  if (!key) {
    res.status(500).json({
            error: "Server not configured: SSN_ENCRYPTION_KEY is missing or invalid (must be a 32-byte base64 key -- run: openssl rand -base64 32).",
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
    res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
    return;
  }

  const { data: callerProfile, error: profileErr } = await admin
    .from("user_profiles")
        .select("role")
        .eq("id", callerData.user.id)
        .single();

  if (profileErr || !callerProfile || !["owner", "admin"].includes(callerProfile.role)) {
    res.status(403).json({ error: "Only an owner or admin can access Social Security Numbers." });
    return;
  }

  const { caregiverId, action, ssn } = req.body || {};
  if (!caregiverId) {
    res.status(400).json({ error: "caregiverId is required." });
    return;
  }

  if (action === "save") {
    const digits = (ssn || "").replace(/\D/g, "");
    if (digits.length !== 9) {
      res.status(400).json({ error: "SSN must be 9 digits." });
      return;
    }
    const encrypted = encrypt(digits, key);
    const last4 = digits.slice(-4);
    const { error: upErr } = await admin.from("caregiver_ssn").upsert({
            caregiver_id: caregiverId,
            ssn_encrypted: encrypted,
            last4,
            updated_at: new Date().toISOString(),
      });
    if (upErr) {
      res.status(500).json({ error: "Failed to save: " + upErr.message });
      return;
    }
    res.status(200).json({ success: true, last4 });
    return;
  }

  if (action === "reveal") {
    const { data, error } = await admin
      .from("caregiver_ssn")
            .select("ssn_encrypted")
            .eq("caregiver_id", caregiverId)
            .single();
    if (error || !data) {
      res.status(404).json({ error: "No SSN on file for this caregiver." });
      return;
    }
    try {
      const plain = decrypt(data.ssn_encrypted, key);
      res.status(200).json({ ssn: plain });
    } catch (e) {
      res.status(500).json({ error: "Could not decrypt SSN -- the encryption key may have changed." });
    }
    return;
  }

  const { data } = await admin
    .from("caregiver_ssn")
          .select("last4")
          .eq("caregiver_id", caregiverId)
          .single();
  res.status(200).json({ onFile: !!data, last4: data?.last4 || null });
  }
