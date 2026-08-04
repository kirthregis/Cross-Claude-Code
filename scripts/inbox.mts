/**
 * EMY Studio — inbox.
 *
 * Reads every improvement suggestion the artist has sent, straight from the
 * local SQLite database. This is the developer's routing point: run it in
 * this workspace, see what she asked for, implement it, and flip the status
 * back to "done" with `--mark`.
 *
 *   npm run inbox                    # all suggestions, newest first
 *   npm run inbox -- --status=new    # only unreviewed ones
 *   npm run inbox -- --limit=10
 *   npm run inbox -- --json          # machine-readable
 *   npm run inbox -- --mark=<id>,done   # flip one suggestion's status (either order)
 *   npm run inbox -- --mark <id> done
 *
 * On a deployed app (Vercel) suggestions land in that deployment's database
 * and also email you if DEV_FEEDBACK_TO is set — this inbox is for local/dev
 * runs where this repo's own ./data/gigradar.db is live.
 */

import { allStudioFeedback, studioFeedbackStats, setStudioFeedbackStatus, type StudioFeedbackRow } from "../src/lib/db";

type StatusFilter = "all" | "new" | "planned" | "done" | "dismissed";

interface Options {
  status: StatusFilter;
  limit: number;
  json: boolean;
  mark?: { id: string; status: "new" | "planned" | "done" | "dismissed" };
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { status: "all", limit: 50, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--status=")) opts.status = a.split("=")[1] as StatusFilter;
    else if (a.startsWith("--limit=")) opts.limit = parseInt(a.split("=")[1], 10) || 50;
    else if (a === "--json") opts.json = true;
    else if (a.startsWith("--mark=")) {
      const parts = a.split("=")[1].split(",");
      const statuses = ["new", "planned", "done", "dismissed"];
      if (parts.length === 2) {
        const [x, y] = parts;
        const id = statuses.includes(x) ? y : x;
        const status = statuses.includes(x) ? x : y;
        if (statuses.includes(status)) opts.mark = { id, status };
      }
    } else if (a === "--mark" && i + 2 < argv.length) {
      const [id, status] = [argv[i + 1], argv[i + 2]];
      if (["new", "planned", "done", "dismissed"].includes(status)) opts.mark = { id, status };
      i += 2;
    }
  }
  return opts;
}

function fmtStatus(s: string): string {
  const map: Record<string, string> = { new: "🆕 NEW", planned: "🟡 PLANNED", done: "🟢 DONE", dismissed: "⚪ NOT NOW" };
  return map[s] ?? s.toUpperCase();
}

function printRow(r: StudioFeedbackRow): void {
  console.log(`#${r.id.slice(0, 8)}  ${fmtStatus(r.status)}  ·  ${r.category ?? "other"} / ${r.priority ?? "—"}  ·  ${new Date(r.createdAt).toLocaleString()}`);
  console.log(`   ${r.text.split("\n").join("\n   ")}`);
  if (r.device) console.log(`   📱 ${r.device}`);
  if (r.plan) {
    try {
      const plan = JSON.parse(r.plan) as { oneLine?: string; plan?: string };
      if (plan.plan) console.log(`   🔧 ${plan.plan.split("\n").join("\n   ")}`);
    } catch {
      /* plan not JSON — skip */
    }
  }
  console.log("");
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.mark) {
    const row = setStudioFeedbackStatus(opts.mark.id, opts.mark.status);
    if (!row) {
      console.error(`No suggestion with id "${opts.mark.id}" found.`);
      process.exit(1);
    }
    console.log(`Marked #${row.id.slice(0, 8)} as ${row.status}. Her device will show this the next time she opens the app.`);
    return;
  }

  const rows = allStudioFeedback().filter((r) => opts.status === "all" || r.status === opts.status);
  const stats = studioFeedbackStats();

  if (opts.json) {
    console.log(JSON.stringify({ stats, items: rows.slice(0, opts.limit) }, null, 2));
    return;
  }

  console.log("📥 EMY Studio — suggestion inbox");
  console.log(`   ${stats.total} total  ·  ${stats.byStatus.new} new  ·  ${stats.byStatus.planned} planned  ·  ${stats.byStatus.done} done  ·  ${stats.byStatus.dismissed} dismissed\n`);

  if (rows.length === 0) {
    console.log("   Nothing here yet — suggestions from the app will appear here.\n");
    return;
  }

  rows.slice(0, opts.limit).forEach(printRow);
  console.log(`   (showing ${Math.min(rows.length, opts.limit)} of ${rows.length} — use --status= / --limit= / --json)`);
}

main();
