import { runUaeSources } from "./uae";
import { runUaeJobBoards } from "./uae-jobs";

export async function runAllSources() {
  const results = await Promise.allSettled([
    runUaeSources(),
    runUaeJobBoards(),
  ]);

  let found = 0;
  let inserted = 0;
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      found += r.value.found ?? 0;
      inserted += r.value.inserted ?? 0;
    } else {
      errors.push(String(r.reason));
    }
  }

  return { found, inserted, errors };
}

export function sourceStatus() {
  return [
    { id: "uae", label: "UAE Verified", setup: "Scraping main UAE club/event sources", configured: true },
    { id: "jobs", label: "Job Boards", setup: "Dubizzle, Indeed UAE, LinkedIn", configured: true }
  ];
}
