/**
 * EMY Studio — the assistant's local brain.
 * Handles all commands offline. Gemini handles open questions.
 */

import type { AssistantDecision, Project } from "./types";

interface Rule { intent: AssistantDecision["intent"]; patterns: RegExp[]; }

const RULES: Rule[] = [
  { intent: "greet", patterns: [/^(hi|hey|hello|yo|good (morning|afternoon|evening)|salam|assalam)[\s!.,]*$/i] },
  { intent: "create_project", patterns: [/(new|create|make|start|add)\s+(a\s+|an\s+)?(project|mix|track|release)/i, /(new|create|make|start)\s+(it|one|another)/i] },
  { intent: "open_project", patterns: [/^(open|go to|show me|take me to|switch to)\s+(the\s+|my\s+)?(.+)$/i] },
  { intent: "list_projects", patterns: [/(what|which|show|list).*(projects?|mixes?|tracks?)/i, /(all|my)\s+(projects?|mixes?|tracks?)/i] },
  { intent: "master", patterns: [/(master|mastering|mix and master|normalize|louder|loudness)/i, /(fix|make|get).*(sound|audio|bass|mix)/i] },
  { intent: "artwork", patterns: [/(cover|artwork|album art|art|thumbnail|image|picture|poster)/i] },
  { intent: "release", patterns: [/(release|package|description|title|tags?|hashtags|upload|youtube|instagram|label|handoff)/i] },
  { intent: "check", patterns: [/(check|ready|compliance|pass|validate|looks? good|good to go)/i] },
  { intent: "settings", patterns: [/settings|api key|gemini|email|notify|preferences|youtube key|analytics key/i] },
  { intent: "status", patterns: [/^(status|progress|what'?s (left|next|up|happening)|how'?s it going|where are we)\b/i] },
  { intent: "help", patterns: [/help|what can you do|how do (i|you)|commands|guide/i] },
  { intent: "thanks", patterns: [/^(thanks|thank you|cheers|shukran|perfect|amazing|great)\b/i] },
  { intent: "gigradar", patterns: [/(gig|radar|booking|venue|pitch|venue|white dubai|soho|base dubai|club|djing)/i] },
  { intent: "analytics", patterns: [/(analytics|stats|statistics|youtube stats|subscribers|views|data)/i] },
  { intent: "distribute", patterns: [/(distribut|royalt|split|smart link|soundcloud|spotify link|apple music link)/i] },
  { intent: "community", patterns: [/(community|connect|collab|collaborate|artist|mena|dubai dj|network)/i] },
  { intent: "epk", patterns: [/(epk|press kit|portrait|bio|biography)/i] },
];

export function routeCommand(text: string): AssistantDecision["intent"] {
  const t = text.trim();
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (p.test(t)) return rule.intent;
    }
  }
  return "fallback";
}

export function greetReply(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning. Your studio is ready — import a mix and I'll master it while you do something else.";
  if (h < 18) return "Good afternoon. What are we working on today?";
  return "Good evening. Studio's open — say the word and we'll master something.";
}

export function helpReply(hasGemini: boolean): string {
  const ai = hasGemini ? "I'm connected to Gemini, so ask me anything — writing, ideas, mastering advice." : "Add a free Gemini API key in Settings and I'll answer open questions too.";
  return "I'm your production assistant. I can:\n" +
    "• \"Master my mix\" — EQ, compression, loudness to platform standard\n" +
    "• \"Make the cover art\" — AI or template artwork, 3000×3000\n" +
    "• \"Build the release pack\" — title, description, tags, file names\n" +
    "• \"Is it ready?\" — full compliance check for YouTube/Instagram/label\n" +
    "• \"Open GigRadar\" — find gigs, generate pitch emails, track revenue\n" +
    "• \"Open Analytics\" — YouTube stats dashboard\n" +
    "• \"Open Community\" — connect with MENA artists\n" +
    "• \"Open Distribute\" — royalty splits, smart links\n\n" + ai;
}

export function replyForIntent(
  intent: AssistantDecision["intent"],
  ctx: { project?: Project; projectCount: number; hasGemini: boolean },
): AssistantDecision {
  const p = ctx.project;
  switch (intent) {
    case "greet": return { intent, reply: greetReply() };
    case "create_project": {
      if (p) return { intent, reply: "You already have \"" + p.meta.name + "\" open. Want me to start a fresh project instead?", action: { type: "navigate", to: "/studio" } };
      return { intent, reply: "Let's start a new project. What do we call it — and is it a mix or a track?" };
    }
    case "open_project":
      if (p) return { intent, reply: "Opening \"" + p.meta.name + "\".", action: { type: "navigate", to: "/studio/p/" + p.meta.id } };
      return { intent, reply: "Opening your projects.", action: { type: "navigate", to: "/studio" } };
    case "list_projects":
      return { intent, reply: ctx.projectCount === 0 ? "No projects yet — say \"create a new project\" to start one." : "You have " + ctx.projectCount + " projects on the studio home screen.", action: { type: "navigate", to: "/studio" } };
    case "master":
      if (!p) return { intent, reply: "Open a project first, then say \"master my mix\".", action: { type: "navigate", to: "/studio" } };
      return { intent, reply: p.meta.mastered ? "This mix is already mastered. Opening the Master tab." : "Opening the Master tab. Drop your audio file in and I'll handle the rest.", action: { type: "navigate", to: "/studio/p/" + p.meta.id + "?tab=master" } };
    case "artwork":
      if (!p) return { intent, reply: "Open a project first, then say \"make the cover art\".", action: { type: "navigate", to: "/studio" } };
      return { intent, reply: p.meta.artworkDone ? "You already have cover art. Opening Artwork tab to regenerate." : "Opening the Artwork tab — AI or template, your choice.", action: { type: "navigate", to: "/studio/p/" + p.meta.id + "?tab=artwork" } };
    case "release":
      if (!p) return { intent, reply: "Open a project first — then I'll write the title, description and tags.", action: { type: "navigate", to: "/studio" } };
      return { intent, reply: "Opening the Release tab — I'll build the YouTube title, description, tags and file names.", action: { type: "navigate", to: "/studio/p/" + p.meta.id + "?tab=release" } };
    case "check":
      if (!p) return { intent, reply: "Open a project and I'll run the full platform check.", action: { type: "navigate", to: "/studio" } };
      return { intent, reply: "Running the compliance check — audio format, loudness, artwork, title and tags.", action: { type: "navigate", to: "/studio/p/" + p.meta.id + "?tab=check" } };
    case "status": {
      if (!p) return { intent, reply: ctx.projectCount === 0 ? "Nothing in the studio yet — say \"create a new project\" to begin." : "You have " + ctx.projectCount + " projects waiting.", action: { type: "navigate", to: "/studio" } };
      const bits = [
        p.audio ? "Audio loaded: " + p.audio.fileName + " (" + Math.floor(p.audio.durationSec / 60) + "m)." : "No audio loaded yet.",
        p.meta.mastered ? "Mastering done ✓" : "Mastering not run yet.",
        p.meta.artworkDone ? "Cover art done ✓" : "Cover art not made yet.",
        p.meta.releaseDone ? "Release pack ready ✓" : "Release pack not generated yet.",
      ];
      return { intent, reply: bits.join("\n") };
    }
    case "settings": return { intent, reply: "Opening Settings — Gemini key, YouTube API key, your handles, and preferences live there.", action: { type: "navigate", to: "/studio/settings" } };
    case "gigradar": return { intent, reply: "Opening GigRadar — find gigs, generate AI pitch emails, track revenue from UAE venues.", action: { type: "navigate", to: "/studio/gigradar" } };
    case "analytics": return { intent, reply: "Opening Analytics — live YouTube stats, subscriber count, recent video performance.", action: { type: "navigate", to: "/studio/analytics" } };
    case "distribute": return { intent, reply: "Opening Distribute — royalty splits, smart links, and free distribution platforms.", action: { type: "navigate", to: "/studio/distribute" } };
    case "community": return { intent, reply: "Opening the MENA Community — discover artists, find collaborators, and spot opportunities across the region.", action: { type: "navigate", to: "/studio/community" } };
    case "epk": return { intent, reply: "Opening your EPK — upload your press kit, portrait, and notes.", action: { type: "navigate", to: "/studio/epk" } };
    case "help": return { intent, reply: helpReply(ctx.hasGemini) };
    case "thanks": return { intent, reply: "Anytime. That's what I'm here for — you make the music, I do the rest." };
    default:
      return { intent: "fallback", reply: ctx.hasGemini ? "I've handed your question to Gemini — one moment." : "Try \"master my mix\", \"open GigRadar\", \"open community\", or say \"help\" for everything I can do." };
  }
}

export function summarizeProject(p: Project): string {
  return [
    "Project: " + p.meta.name + " (" + p.meta.kind + ")",
    p.audio ? "• Audio: " + p.audio.fileName : "• Audio: not imported",
    p.meta.mastered ? "• Master: done @ " + p.master?.outputLufs.toFixed(1) + " LUFS" : "• Master: pending",
    p.meta.artworkDone ? "• Artwork: done" : "• Artwork: pending",
    p.meta.releaseDone ? "• Release pack: done" : "• Release pack: pending",
  ].join("\n");
}