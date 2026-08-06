"use client";
import { useEffect, useState } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import { useSettings } from "@/lib/studio/store";
import { fetchYoutubeStats, formatCount, type YoutubeStats } from "@/lib/studio/analytics";
import Link from "next/link";

export default function AnalyticsPage() {
  const settings = useSettings();
  const [ytStats, setYtStats] = useState<YoutubeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const load = async () => {
    if (!settings.youtubeApiKey) { setError("Add your YouTube API key in Settings to see live data."); return; }
    setLoading(true); setError(null);
    try {
      const stats = await fetchYoutubeStats(settings.youtubeApiKey, settings.youtubeChannel);
      if (!stats) { setError("Could not fetch YouTube data. Check your API key and channel URL in Settings."); }
      else { setYtStats(stats); setLastFetch(Date.now()); }
    } catch { setError("Network error — try again."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const statCards = ytStats ? [
    { label: "Subscribers", value: formatCount(ytStats.subscriberCount), icon: "👥", color: "text-fuchsia-300" },
    { label: "Total Views", value: formatCount(ytStats.viewCount), icon: "👁", color: "text-blue-300" },
    { label: "Videos", value: formatCount(ytStats.videoCount), icon: "🎬", color: "text-emerald-300" },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">Live data from your YouTube channel. Add your API key in Settings to unlock.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && <span className="text-[11px] text-zinc-600">Updated {new Date(lastFetch).toLocaleTimeString()}</span>}
          <Button variant="ghost" onClick={() => void load()} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</Button>
          <Link href="/studio/settings" className="text-xs text-zinc-500 hover:text-zinc-300">Settings →</Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-300">{error}</p>
          <Link href="/studio/settings" className="mt-2 inline-block text-xs text-fuchsia-400 hover:underline">→ Go to Settings to add YouTube API key</Link>
        </div>
      )}

      {!settings.youtubeApiKey && !error && (
        <Card className="p-5">
          <SectionLabel>Connect YouTube Analytics</SectionLabel>
          <p className="mt-2 text-sm text-zinc-400">Get your free YouTube Data API v3 key from Google Cloud Console, then paste it in Settings.</p>
          <div className="mt-3 flex gap-2">
            <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer"
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition">
              🔑 Get YouTube API Key (Free)
            </a>
            <Link href="/studio/settings" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
              Open Settings
            </Link>
          </div>
        </Card>
      )}

      {ytStats && (
        <>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className="text-lg font-extrabold text-white">{ytStats.channelTitle}</p>
            <p className="text-xs text-zinc-500">YouTube Channel</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {statCards.map(s => (
              <Card key={s.label} className="p-4 text-center">
                <div className="text-2xl">{s.icon}</div>
                <div className={`mt-1 text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </Card>
            ))}
          </div>

          <div>
            <SectionLabel>Recent Videos</SectionLabel>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {ytStats.recentVideos.map(v => (
                <a key={v.id} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer"
                  className="group flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 transition hover:border-fuchsia-500/40">
                  <img src={v.thumbnail} alt={v.title} className="h-16 w-24 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 line-clamp-2 group-hover:text-fuchsia-300">{v.title}</p>
                    <div className="mt-1 flex gap-3 text-[11px] text-zinc-500">
                      <span>👁 {formatCount(v.views)}</span>
                      <span>❤ {formatCount(v.likes)}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-600">{new Date(v.publishedAt).toLocaleDateString()}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      <Card className="p-4 sm:p-5">
        <SectionLabel>Coming Soon</SectionLabel>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {["Spotify for Artists — streams, saves, playlist adds","Instagram — followers, reach, engagement rate","TikTok — views, shares, profile visits","GigRadar — bookings won vs pitched, revenue pipeline"].map(item => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
              <span className="text-zinc-700">◉</span>{item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
