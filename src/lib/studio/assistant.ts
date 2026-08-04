/**
 * EMY Studio — the assistant's local brain.
 *
 * When a Gemini API key is present, open chat goes to the model (see
 * src/lib/studio/gemini.ts). But every *command* ("master this mix",
 * "make the cover", "what's left to do?") is understood here, locally, so
 * the voice assistant works fully offline and with zero configuration.
 *
 * Pure + unit-tested.
 */

import type { AssistantDecision, Project } from "./types";

interface Rule {
  intent: AssistantDecision["intent"];
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "greet",
    patterns: [/^(hi|hey|hello|yo|good (morning|afternoon|evening)|salam|assalam)[\s!.,]*$/i],
  },
  {
    intent: "create_project",
    patterns: [
      /(new|create|make|start|add)\s+(a\s+|an\s+)?(project|mix|track|release)/i,
      /(new|create|make|start)\s+(it|one|another)/i,
    ],
  },
  {
    intent: "open_project",
    patterns: [
      /^(open|go to|show me|take me to|switch to)\s+(the\s+|my\s+)?(.+)$/i,
      /^(open|go to|show me)\s+(my\s+)?(mix|track|project)/i,
    ],
  },
  {
    intent: "list_projects",
    patterns: [/(what|which|show|list).*(projects?|mixes?|tracks?)/i, /(all|my)\s+(projects?|mixes?|tracks?)/i],
  },
  {
    intent: "master",
    patterns: [
      /(master|mastering|mix and master|mixdown|normalize|louder|loudness|audio engineer)/i,
      /(fix|make|get).*(sound|audio|bass|mix)/i,
    ],
  },
  {
    intent: "artwork",
    patterns: [/(cover|artwork|album art|art|thumbnail|image|picture|poster)/i],
  },
  {
    intent: "release",
    patterns: [/(release|package|description|title|tags?|hashtags|upload|youtube|instagram|label|handoff)/i],
  },
  {
    intent: "check",
    patterns: [/(check|ready|compliance|pass|validate|looks? good|good to go)/i],
  },
  {
    intent: "settings",
    patterns: [/settings|api key|gemini|email|notify|preferences/i],
  },
  {
    intent: "status",
    patterns: [/^(status|progress|what'?s (left|next|up|happening)|how'?s it going|where are we)\b/i, /(what's|what is)\s+(done|remaining|the plan)/i],
  },
  {
    intent: "help",
    patterns: [/help|what can you do|how do (i|you)|what do you do|commands|guide/i],
  },
  {
    intent: "thanks",
    patterns: [/^(thanks|thank you|cheers|shukran|perfect|amazing|great)\b/i],
  },
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
  const ai = hasGemini
    ? "I'm connected to Gemini, so ask me anything — writing, ideas, mastering advice."
    : "Add a free Gemini API key in Settings and I'll answer open questions too — right now I handle commands offline.";
  return (
    `I'm your production assistant. I can:\n` +
    `• "Create a new mix project" — start a project\n` +
    `• "Master my mix" — open mastering (EQ, compression, loudness to platform standard)\n` +
    `• "Make the cover art" — AI or template artwork, 3000×3000\n` +
    `• "Build the release pack" — title, description, tags, file names\n` +
    `• "Is it ready?" — full compliance check for YouTube/Instagram/label\n` +
    `• "What's left to do?" — where the project stands\n\n` +
    ai
  );
}

export function replyForIntent(
  intent: AssistantDecision["intent"],
  ctx: { project?: Project; projectCount: number; hasGemini: boolean },
): AssistantDecision {
  const p = ctx.project;
  switch (intent) {
    case "greet":
      return { intent, reply: greetReply() };

    case "create_project": {
      if (p) {
        return { intent, reply: `You already have "${p.meta.name}" open. Want me to start a fresh project instead?`, action: { type: "navigate", to: "/studio" } };
      }
      return { intent, reply: "Let's start a new project. What do we call it — and is it a mix or a track?" };
    }

    case "open_project":
      if (p) return { intent, reply: `Opening "${p.meta.name}".`, action: { type: "navigate", to: `/studio/p/${p.meta.id}` } };
      if (ctx.projectCount === 0) return { intent, reply: "You don't have any projects yet. Say “create a new project” and we'll start one." };
      return { intent, reply: "Opening your projects.", action: { type: "navigate", to: "/studio" } };

    case "list_projects":
      return {
        intent,
        reply:
          ctx.projectCount === 0
            ? "No projects yet — say “create a new project” to start one."
            : `You have ${ctx.projectCount} project${ctx.projectCount === 1 ? "" : "s"} on the studio home screen.`,
        action: { type: "navigate", to: "/studio" },
      };

    case "master":
      if (!p) return { intent, reply: "Open a project first, then say “master my mix”.", action: { type: "navigate", to: "/studio" } };
      return {
        intent,
        reply: p.meta.mastered
          ? "This mix is already mastered. I can re-run it with different settings if you like — the Master tab is open."
          : p.audio
            ? "Opening the Master tab. Import the audio file if it isn't loaded, pick a target (YouTube is -14 LUFS), then hit Master. I'll ping you when it's done."
            : "Opening the Master tab — drop your audio file in and I'll handle the rest.",
        action: { type: "navigate", to: `/studio/p/${p.meta.id}?tab=master` },
      };

    case "artwork":
      if (!p) return { intent, reply: "Open a project first, then say “make the cover art”.", action: { type: "navigate", to: "/studio" } };
      return {
        intent,
        reply: p.meta.artworkDone
          ? "You already have cover art for this one. The Artwork tab can regenerate or try a different look."
          : "Opening the Artwork tab — with a Gemini key I'll design a cover from your track's vibe; without one, pick a studio template.",
        action: { type: "navigate", to: `/studio/p/${p.meta.id}?tab=artwork` },
      };

    case "release":
      if (!p) return { intent, reply: "Open a project first — then I'll write the title, description and tags.", action: { type: "navigate", to: "/studio" } };
      return {
        intent,
        reply: "Opening the Release tab — I'll build the YouTube title, description, tags and file names, and prep the upload handoff.",
        action: { type: "navigate", to: `/studio/p/${p.meta.id}?tab=release` },
      };

    case "check":
      if (!p) return { intent, reply: "Open a project and I'll run the full platform check.", action: { type: "navigate", to: "/studio" } };
      return {
        intent,
        reply: "Running the compliance check — audio format, loudness, artwork, title and tags. Opening the Check tab.",
        action: { type: "navigate", to: `/studio/p/${p.meta.id}?tab=check` },
      };

    case "status": {
      if (!p) return { intent, reply: ctx.projectCount === 0 ? "Nothing in the studio yet — say “create a new project” to begin." : `You have ${ctx.projectCount} projects waiting on the home screen.`, action: { type: "navigate", to: "/studio" } };
      const bits: string[] = [];
      bits.push(p.audio ? `Audio loaded: ${p.audio.fileName} (${Math.floor(p.audio.durationSec / 60)}m).` : "No audio loaded yet.");
      bits.push(p.meta.mastered ? "Mastering done ✓" : p.audio ? "Mastering not run yet." : "Mastering waiting on the audio file.");
      bits.push(p.meta.artworkDone ? "Cover art done ✓" : "Cover art not made yet.");
      bits.push(p.meta.releaseDone ? "Release pack ready ✓" : "Release pack not generated yet.");
      return { intent, reply: bits.join("\n") };
    }

    case "settings":
      return { intent, reply: "Opening Settings — Gemini key, your handles, email ping and preferences live there.", action: { type: "navigate", to: "/studio/settings" } };

    case "help":
      return { intent, reply: helpReply(ctx.hasGemini) };

    case "thanks":
      return { intent, reply: "Anytime. That's what I'm here for — you make the music, I do the rest." };

    default:
      return {
        intent: "fallback",
        reply: ctx.hasGemini
          ? "I've handed your question to Gemini — one moment."
          : "I didn't quite get that as a command. Try “master my mix”, “make the cover art”, “build the release pack” or “is it ready?” — or say “help” for everything I can do.",
      };
  }
}

export function summarizeProject(p: Project): string {
  const s: string[] = [];
  s.push(`Project: ${p.meta.name} (${p.meta.kind})`);
  s.push(p.audio ? `• Audio: ${p.audio.fileName}` : `• Audio: not imported`);
  s.push(p.meta.mastered ? `• Master: done @ ${p.master?.outputLufs.toFixed(1)} LUFS` : `• Master: pending`);
  s.push(p.meta.artworkDone ? `• Artwork: done` : `• Artwork: pending`);
  s.push(p.meta.releaseDone ? `• Release pack: done` : `• Release pack: pending`);
  return s.join("\n");
}
