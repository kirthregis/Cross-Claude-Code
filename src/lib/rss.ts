/**
 * Minimal RSS/Atom parsing — deliberately dependency-free so it runs inside
 * the ingest loop in milliseconds. Handles the RSS/Atom shapes Google News,
 * most event calendars and venue blogs emit. Used by every feed source.
 */

export interface RssItem {
  title: string;
  link?: string;
  description?: string;
  /** Normalised to ISO. */
  published: string;
}

export function parseRss(text: string): RssItem[] {
  const parts = text.split(/<item>|<entry>/).slice(1);
  const out: RssItem[] = [];
  for (const it of parts) {
    if (!it.includes("</item>") && !it.includes("</entry>")) continue;
    const pick = (tag: string) =>
      it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

    const publishedRaw = pick("pubDate") ?? pick("published") ?? pick("updated") ?? pick("dc:date");
    const published = publishedRaw ? new Date(publishedRaw).toISOString() : new Date().toISOString();
    out.push({
      title: pick("title") ?? "Untitled",
      link: pick("link"),
      description: pick("description") ?? pick("summary"),
      published,
    });
  }
  return out;
}
