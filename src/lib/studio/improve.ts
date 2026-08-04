/**
 * EMY Studio — improvement analysis.
 *
 * When she sends a suggestion, the app categorises it and drafts an
 * implementation plan. With a Gemini key on the server this is AI-written;
 * without one, a keyword-based categoriser still produces a sensible plan.
 * Both are pure/unit-testable here; the server route stores the result.
 */

export type SuggestionCategory = "feature" | "bug" | "design" | "content" | "other";

export interface SuggestionAnalysis {
  category: SuggestionCategory;
  priority: "low" | "medium" | "high";
  oneLine: string;
  plan: string;
}

const CATEGORY_RULES: { cat: SuggestionCategory; words: RegExp }[] = [
  { cat: "bug", words: /\b(bug\w*|broken|error\w*|crash\w*|fail\w*|frozen|stuck|wrong|not working|doesn'?t work|issue\w*|blurr\w*|pixelat\w*|flicker\w*|delay\w*|slow)\b/i },
  { cat: "design", words: /\b(look|colour|color|design|dark|light|theme|font|button|style|ugly|pretty|layout|artwork style)\b/i },
  { cat: "content", words: /\b(description\w*|title\w*|tag\w*|caption\w*|copyright|text\w*|writing|hashtag\w*|copy)\b/i },
  { cat: "feature", words: /\b(add|want|would love|could you|suggest|feature|new|support|export|upload|auto|share|integration|spotify|soundcloud|instagram|tiktok|youtube|whatsapp|voice|reminder|timer)\b/i },
];

export function categorizeSuggestion(text: string): SuggestionCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.words.test(text)) return rule.cat;
  }
  return "other";
}

export function priorityFor(cat: SuggestionCategory, text: string): "low" | "medium" | "high" {
  if (/\b(crash|deleted|lost|urgent|asap|not working|broken|error)\b/i.test(text)) return "high";
  if (cat === "bug") return "medium";
  if (cat === "feature") return "medium";
  return "low";
}

function planFor(cat: SuggestionCategory, text: string): string {
  const t = text.trim();
  switch (cat) {
    case "bug":
      return `Investigate: reproduce "${t.slice(0, 80)}…" on the reported screen, check the relevant panel code, fix and re-run the test suite before shipping.`;
    case "design":
      return `Design pass: apply the requested visual change (${t.slice(0, 60)}…) across the relevant studio screen, keep the 3000×3000 / mobile-first rules, preview before shipping.`;
    case "content":
      return `Content update: adjust the release-pack templates (title/description/tags rules) so new releases reflect "${t.slice(0, 60)}…".`;
    case "feature":
      return `Feature: spec "${t.slice(0, 80)}…" — which tab it belongs to, the inputs it needs, and where the button goes. Implement, test, then ping the artist when it's live.`;
    default:
      return `Reviewed "${t.slice(0, 80)}…" — assess against the studio's roadmap and confirm next step with the developer.`;
  }
}

/** Offline analysis — no AI needed. */
export function analyzeSuggestion(text: string): SuggestionAnalysis {
  const category = categorizeSuggestion(text);
  return {
    category,
    priority: priorityFor(category, text),
    oneLine: `"${text.trim().slice(0, 100)}${text.trim().length > 100 ? "…" : ""}"`,
    plan: planFor(category, text),
  };
}

export function analysisPrompt(text: string): string {
  return [
    `You are the product manager of EMY Studio, a music-production app used by a professional DJ to master mixes, generate cover art and package releases for YouTube/labels.`,
    `A user just sent this improvement suggestion:`,
    `"""${text}"""`,
    ``,
    `Return STRICT JSON only, no markdown, with exactly these fields:`,
    `- "category": one of "feature" | "bug" | "design" | "content" | "other"`,
    `- "priority": "low" | "medium" | "high"`,
    `- "oneLine": a short (under 20 words) summary of what she wants`,
    `- "plan": 3-6 concrete implementation steps (which screen/tab, what changes), under 120 words, written for a developer`,
  ].join("\n");
}

export function parseAnalysisJson(raw: string): SuggestionAnalysis | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const obj = JSON.parse(raw.slice(start, end + 1)) as Partial<SuggestionAnalysis>;
    const category = (["feature", "bug", "design", "content", "other"] as const).includes(obj.category as SuggestionCategory)
      ? (obj.category as SuggestionCategory)
      : "other";
    const priority = (["low", "medium", "high"] as const).includes(obj.priority as SuggestionAnalysis["priority"])
      ? (obj.priority as SuggestionAnalysis["priority"])
      : "medium";
    return {
      category,
      priority,
      oneLine: typeof obj.oneLine === "string" ? obj.oneLine.slice(0, 200) : "",
      plan: typeof obj.plan === "string" ? obj.plan.slice(0, 1000) : "",
    };
  } catch {
    return null;
  }
}

/** A short, warm reply the assistant can speak/print after she submits. */
export function thanksReply(analysis: SuggestionAnalysis, id: string): string {
  const next =
    analysis.priority === "high"
      ? "This looks important — I'm bumping it to the top of my list."
      : "It's on my improvement list now.";
  return `Got it — suggestion #${id.slice(0, 6)} is logged. ${next} Here's what I noted: ${analysis.oneLine}. You'll see it marked "planned" or "done" in your suggestions here.`;
}
