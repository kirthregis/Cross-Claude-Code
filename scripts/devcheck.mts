/**
 * EMY Studio — developer setup check.
 *
 * One command to confirm the hand-off is complete after you do your part:
 *
 *   npm run devcheck
 *
 * It reads the same env vars the app uses and prints exactly what's set,
 * what's missing, and the one action each missing item needs. No secrets
 * are printed — only set/not-set.
 */

import { existsSync } from "fs";
import { allStudioFeedback, studioFeedbackStats } from "../src/lib/db";

interface Check {
  key: string;
  label: string;
  ok: boolean;
  note: string;
  action: string;
  link?: string;
  optional?: boolean;
}

const ENV = process.env;

function checks(): Check[] {
  const gemini = !!ENV.GEMINI_API_KEY;
  const fal = !!ENV.FAL_KEY;
  const resend = !!ENV.RESEND_API_KEY;
  const notifyTo = !!ENV.STUDIO_NOTIFY_TO;
  const devFeedbackTo = !!ENV.DEV_FEEDBACK_TO;
  const adminToken = !!ENV.STUDIO_ADMIN_TOKEN;
  const appUrl = !!ENV.APP_URL;

  return [
    {
      key: "GEMINI_API_KEY",
      label: "AI — Gemini key (chat + AI covers)",
      ok: gemini,
      note: gemini ? "Set ✓ — assistant AI and AI cover art are live." : "Missing — open questions and AI cover design stay offline.",
      action: "Get a free key (no card) at https://aistudio.google.com/apikey, then add GEMINI_API_KEY to .env.local (laptop) or Vercel env vars.",
      link: "https://aistudio.google.com/apikey",
    },
    {
      key: "STUDIO_ADMIN_TOKEN",
      label: "Developer back end (/studio/admin)",
      ok: adminToken,
      note: adminToken ? "Set ✓ — you can open /studio/admin to review suggestions." : "Missing — the suggestions page stays locked (401).",
      action: "Pick any password and set STUDIO_ADMIN_TOKEN (e.g. a long random string). You'll enter it once on /studio/admin.",
    },
    {
      key: "RESEND_API_KEY + STUDIO_NOTIFY_TO",
      label: "Email pings when a master/export finishes",
      ok: resend && notifyTo,
      note: resend && notifyTo ? "Set ✓ — she gets an email when masters finish." : "Missing — the on-device ping still works; email is off.",
      action: "Free key at https://resend.com, then set RESEND_API_KEY and STUDIO_NOTIFY_TO (her email).",
      link: "https://resend.com",
      optional: true,
    },
    {
      key: "DEV_FEEDBACK_TO",
      label: "Suggestion alerts to your email",
      ok: devFeedbackTo,
      note: devFeedbackTo ? "Set ✓ — each suggestion emails you with the AI plan." : "Missing — suggestions still land in the DB + /studio/admin.",
      action: "Set DEV_FEEDBACK_TO to your email (can reuse STUDIO_NOTIFY_TO).",
      optional: true,
    },
    {
      key: "FAL_KEY",
      label: "fal.ai image engine (Flux/Recraft/Ideogram)",
      ok: fal,
      note: fal ? "Set ✓ — fal.ai covers available." : "Skipped — Gemini free tier covers AI artwork; add later only if you want those models.",
      action: "Optional — add FAL_KEY from https://fal.ai/dashboard/keys when you want it.",
      link: "https://fal.ai/dashboard/keys",
      optional: true,
    },
    {
      key: "APP_URL",
      label: "App URL (used in suggestion emails)",
      ok: appUrl,
      note: appUrl ? `Set ✓ (${ENV.APP_URL})` : "Missing — suggestion emails link to /studio/admin without a host.",
      action: "Set APP_URL=https://your-app.vercel.app after deploying.",
      optional: true,
    },
  ];
}

function main(): void {
  console.log("🔍 EMY Studio — developer setup check\n");

  const dbPath = ENV.DB_PATH ?? "./data/gigradar.db";
  const dbExists = existsSync(dbPath);

  console.log(`Database: ${dbPath} ${dbExists ? "(exists)" : "(will be created on first use)"}`);

  const stats = allStudioFeedback();
  const s = studioFeedbackStats();
  console.log(`Suggestions in DB: ${stats.length} total  (${s.byStatus.new} new · ${s.byStatus.planned} planned · ${s.byStatus.done} done)`);

  console.log("\n──────────────────────────────────────────────");
  const list = checks();
  let failures = 0;
  for (const c of list) {
    const tag = c.ok ? "✓" : c.optional ? "○" : "✗";
    if (!c.ok && !c.optional) failures++;
    console.log(`\n${tag} ${c.label}`);
    console.log(`   ${c.note}`);
    if (!c.ok) console.log(`   → ${c.action}`);
  }

  console.log("\n──────────────────────────────────────────────");
  if (failures === 0) {
    console.log("✅ Required setup complete — the app is hand-off ready.");
  } else {
    console.log(`⛔ ${failures} required item${failures === 1 ? "" : "s"} left — do those first (optional ○ items can wait).`);
  }
  console.log("\nAfter deploying: open /studio/admin once to confirm the back end, then hand the app to her.\n");
}

main();
