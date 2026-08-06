"use client";
import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import { useSettings, saveSettings } from "@/lib/studio/store";
import {
  fetchYoutubeStats, formatCount, type YoutubeStats,
  fetchSpotifyStats, type SpotifyStats,
  generatePkce, buildSpotifyAuthUrl, exchangeSpotifyCode,
  saveSpotifyTokens, loadSpotifyTokens, clearSpotifyTokens,
  savePkceVerifier, loadPkceVerifier,
} from "@/lib/studio/analytics";
import Link from "next/link";

function AnalyticsPageInner() {
  const settings = useSettings();
  const searchParams = useSearchParams();

  // YouTube state
  const [ytStats, setYtStats] = useState<YoutubeStats | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  // Spotify state
  const [spStats, setSpStats] = useState<SpotifyStats | null>(null);
  const [spLoading, setSpLoading] = useState(false);
  const [spError, setSpError] = useState<string | null>(null);
  const [spConnected, setSpConnected] = useState(false);
  const [tab, setTab] = useState<"youtube" | "spotify">("youtube");

  // ── YouTube ──
  const loadYt = useCallback(async () => {
    if (!settings.youtubeApiKey) { setYtError("Add your YouTube API key in Settings."); return; }
    setYtLoading(true); setYtError(null);
    try {
      const stats = await fetchYoutubeStats(settings.youtubeApiKey, settings.youtubeChannel);
      if (!stats) setYtError("Could not fetch YouTube data. Check your API key and channel URL.");
      else { setYtStats(stats); setLastFetch(Date.now()); }
    } catch { setYtError("Network error — try again."); }
    finally { setYtLoading(false); }
  }, [settings.youtubeApiKey, settings.youtubeChannel]);

  useEffect(() => { void loadYt(); }, []);

  // ── Spotify OAuth callback handler ──
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      const tokens = loadSpotifyTokens();
      if (tokens && tokens.expiresAt > Date.now()) setSpConnected(true);
      return;
    }
    const verifier = loadPkceVerifier();
    const clientId = settings.spotifyClientId ?? "";
    const redirectUri = window.location.origin + "/studio/analytics";
    if (!verifier || !clientId) return;
    setSpLoading(true);
    exchangeSpotifyCode(code, verifier, clientId, redirectUri).then(tokens => {
      if (!tokens) { setSpError("Spotify auth failed. Try reconnecting."); setSpLoading(false); return; }
      saveSpotifyTokens(tokens);
      setSpConnected(true);
      setSpLoading(false);
      window.history.replaceState({}, "", "/studio/analytics");
    });
  }, []);

  // ── Load Spotify stats once connected ──
  const loadSpotify = useCallback(async () => {
    const tokens = loadSpotifyTokens();
    if (!tokens || tokens.expiresAt < Date.now()) { setSpError("Session expired. Reconnect Spotify."); setSpConnected(false); return; }
    if (!settings.spotifyArtistId) { setSpError("Add your Spotify Artist ID in Settings."); return; }
    setSpLoading(true); setSpError(null);
    try {
      const stats = await fetchSpotifyStats(tokens.accessToken, settings.spotifyArtistId);
      if (!stats) setSpError("Could not fetch Spotify data. Check your Artist ID.");
      else setSpStats(stats);
    } catch { setSpError("Network error fetching Spotify data."); }
    finally { setSpLoading(false); }
  }, [settings.spotifyArtistId]);

  useEffect(() => { if (spConnected) void loadSpotify(); }, [spConnected]);

  // ── Connect Spotify ──
  const connectSpotify = useCallback(async () => {
    const clientId = settings.spotifyClientId?.trim();
    if (!clientId) { setSpError("Add your Spotify Client ID in Settings first."); return; }
    const { verifier, challenge } = await generatePkce();
    savePkceVerifier(verifier);
    const redirectUri = window.location.origin + "/studio/analytics";
    window.location.href = buildSpotifyAuthUrl(clientId, redirectUri, challenge);
  }, [settings.spotifyClientId]);

  const disconnectSpotify = () => { clearSpotifyTokens(); setSpConnected(false); setSpStats(null); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">Live stats from YouTube and Spotify.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && <span className="text-[11px] text-zinc-600">Updated {new Date(lastFetch).toLocaleTimeString()}</span>}
          <Link href="/studio/settings" className="text-xs text-zinc-500 hover:text-zinc-300">Settings →</Link>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {([
          { id: "youtube", label: "▶ YouTube" },
          { id: "spotify", label: "🎵 Spotify" },
        ] as { id: "youtube" | "spotify"; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"flex-1 rounded-xl py-2 text-xs font-semibold transition " + (tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── YOUTUBE TAB ── */}
      {tab === "youtube" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => void loadYt()} disabled={ytLoading}>{ytLoading ? "Loading…" : "↻ Refresh"}</Button>
          </div>

          {ytError && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-300">{ytError}</p>
              <Link href="/studio/settings" className="mt-2 inline-block text-xs text-fuchsia-400 hover:underline">→ Open Settings</Link>
            </div>
          )}

          {!settings.youtubeApiKey && !ytError && (
            <Card className="p-5">
              <SectionLabel>Connect YouTube Analytics</SectionLabel>
              <p className="mt-2 text-sm text-zinc-400">Get a free YouTube Data API v3 key from Google Cloud Console.</p>
              <div className="mt-3 flex gap-2">
                <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer"
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition">
                  🔑 Get YouTube API Key
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
                {[
                  { label: "Subscribers", value: formatCount(ytStats.subscriberCount), icon: "👥", color: "text-fuchsia-300" },
                  { label: "Total Views", value: formatCount(ytStats.viewCount), icon: "👁", color: "text-blue-300" },
                  { label: "Videos", value: formatCount(ytStats.videoCount), icon: "🎬", color: "text-emerald-300" },
                ].map(s => (
                  <Card key={s.label} className="p-4 text-center">
                    <div className="text-2xl">{s.icon}</div>
                    <div className={`mt-1 text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-zinc-500">{s.label}</div>
                  </Card>
                ))}
              </div>
              <SectionLabel>Recent Videos</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
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
            </>
          )}
        </div>
      )}

      {/* ── SPOTIFY TAB ── */}
      {tab === "spotify" && (
        <div className="space-y-4">
          {!spConnected ? (
            <Card className="p-5">
              <SectionLabel>Connect Spotify for Artists</SectionLabel>
              <p className="mt-2 text-sm text-zinc-400">
                See your streams, followers, top tracks and releases directly in EMY Studio.
                You need a free Spotify Developer app — takes 2 minutes.
              </p>
              <div className="mt-4 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400">
                <p className="font-semibold text-zinc-300">Setup (one time):</p>
                <ol className="list-decimal space-y-1.5 pl-4">
                  <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">developer.spotify.com/dashboard</a> — log in with your Spotify account.</li>
                  <li>Click "Create app". Name: "EMY Studio". Redirect URI: <span className="font-mono text-zinc-300">{typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/studio/analytics</span></li>
                  <li>Copy the <strong className="text-zinc-200">Client ID</strong> and paste it in Settings → Spotify Client ID.</li>
                  <li>Find your <strong className="text-zinc-200">Artist ID</strong>: open Spotify → your artist profile → Share → Copy link → the ID is the string after /artist/</li>
                  <li>Paste Artist ID in Settings → Spotify Artist ID.</li>
                </ol>
              </div>
              {spError && <p className="mt-3 text-xs text-red-300">{spError}</p>}
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void connectSpotify()} disabled={spLoading}>
                  {spLoading ? "Connecting…" : "🎵 Connect Spotify"}
                </Button>
                <Link href="/studio/settings" className="inline-flex items-center rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                  Open Settings
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">✓ Spotify Connected</span>
                <Button variant="ghost" onClick={() => void loadSpotify()} disabled={spLoading}>{spLoading ? "Loading…" : "↻ Refresh"}</Button>
                <Button variant="danger" onClick={disconnectSpotify}>Disconnect</Button>
              </div>

              {spError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{spError}</div>}

              {spStats && (
                <>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <p className="text-lg font-extrabold text-white">{spStats.artistName}</p>
                    <p className="text-xs text-zinc-500">Spotify Artist</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="p-4 text-center">
                      <div className="text-2xl">👥</div>
                      <div className="mt-1 text-2xl font-extrabold text-emerald-300">{formatCount(spStats.followers)}</div>
                      <div className="text-xs text-zinc-500">Followers</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl">📈</div>
                      <div className="mt-1 text-2xl font-extrabold text-fuchsia-300">{spStats.popularity}/100</div>
                      <div className="text-xs text-zinc-500">Popularity Score</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl">🎵</div>
                      <div className="mt-1 text-2xl font-extrabold text-blue-300">{spStats.topTracks.length}</div>
                      <div className="text-xs text-zinc-500">Top Tracks</div>
                    </Card>
                  </div>

                  <SectionLabel>Top Tracks</SectionLabel>
                  <div className="space-y-2">
                    {spStats.topTracks.map((t, i) => (
                      <div key={t.name} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                        <span className="text-lg font-black text-zinc-600 w-5 shrink-0">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{t.name}</p>
                          <p className="text-[11px] text-zinc-500">{t.album}</p>
                        </div>
                        <span className="text-xs text-fuchsia-300 shrink-0">{t.streams}</span>
                        {t.previewUrl && (
                          <audio controls src={t.previewUrl} className="h-7 w-24 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {spStats.recentAlbums.length > 0 && (
                    <>
                      <SectionLabel>Recent Releases</SectionLabel>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {spStats.recentAlbums.map(a => (
                          <a key={a.name} href={a.spotifyUrl} target="_blank" rel="noreferrer"
                            className="group flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-fuchsia-500/40 transition">
                            {a.imageUrl && <img src={a.imageUrl} alt={a.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-fuchsia-300">{a.name}</p>
                              <p className="text-[11px] text-zinc-500">{a.releaseDate}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <Card className="p-4 sm:p-5">
        <SectionLabel>Coming Soon</SectionLabel>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {["Instagram — followers, reach, engagement rate", "TikTok — views, shares, profile visits", "GigRadar — bookings won vs pitched", "Revenue pipeline — AED earned per month"].map(item => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
              <span className="text-zinc-700">◉</span>{item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-sm animate-pulse">Loading analytics…</div>}>
      <AnalyticsPageInner />
    </Suspense>
  );
}
