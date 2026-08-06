export interface YoutubeStats {
  channelTitle: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  recentVideos: { id: string; title: string; views: string; likes: string; thumbnail: string; publishedAt: string }[];
}

export async function fetchYoutubeStats(apiKey: string, channelUrl: string): Promise<YoutubeStats | null> {
  if (!apiKey || !channelUrl) return null;
  try {
    const handle = channelUrl.includes("@")
      ? channelUrl.split("@").pop()?.split("/")[0] ?? ""
      : channelUrl.split("/").pop() ?? "";
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as {
      items?: { id: string; snippet: { title: string }; statistics: { subscriberCount: string; viewCount: string; videoCount: string } }[]
    };
    const channel = searchData.items?.[0];
    if (!channel) return null;
    const channelId = channel.id;
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=6&order=date&type=video&key=${apiKey}`
    );
    const videosData = await videosRes.json() as {
      items?: { id: { videoId: string }; snippet: { title: string; publishedAt: string; thumbnails: { medium: { url: string } } } }[]
    };
    const videoIds = videosData.items?.map(v => v.id.videoId).join(",") ?? "";
    let recentVideos: YoutubeStats["recentVideos"] = [];
    if (videoIds) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
      );
      const statsData = await statsRes.json() as {
        items?: { id: string; snippet: { title: string; publishedAt: string; thumbnails: { medium: { url: string } } }; statistics: { viewCount: string; likeCount: string } }[]
      };
      recentVideos = (statsData.items ?? []).map(v => ({
        id: v.id,
        title: v.snippet.title,
        views: v.statistics.viewCount ?? "0",
        likes: v.statistics.likeCount ?? "0",
        thumbnail: v.snippet.thumbnails.medium.url,
        publishedAt: v.snippet.publishedAt,
      }));
    }
    return {
      channelTitle: channel.snippet.title,
      subscriberCount: channel.statistics.subscriberCount,
      viewCount: channel.statistics.viewCount,
      videoCount: channel.statistics.videoCount,
      recentVideos,
    };
  } catch {
    return null;
  }
}

export function formatCount(n: string | number): string {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// ── Spotify Web API (client-side PKCE flow) ──────────────────────────────

export interface SpotifyStats {
  artistName: string;
  followers: number;
  popularity: number;
  monthlyListeners?: number;
  topTracks: { name: string; streams: string; album: string; previewUrl: string | null }[];
  recentAlbums: { name: string; releaseDate: string; imageUrl: string; spotifyUrl: string }[];
}

/**
 * Exchange a Spotify authorization code for tokens using PKCE.
 * Call this after the user is redirected back with ?code=...
 */
export async function exchangeSpotifyCode(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      }),
    });
    if (!res.ok) return null;
    const j = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
    return {
      accessToken: j.access_token,
      refreshToken: j.refresh_token,
      expiresAt: Date.now() + j.expires_in * 1000,
    };
  } catch { return null; }
}

/** Generate PKCE code verifier + challenge. */
export async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 43);
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}

/** Build the Spotify OAuth URL for PKCE flow. */
export function buildSpotifyAuthUrl(clientId: string, redirectUri: string, challenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "user-read-private user-top-read user-read-recently-played",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });
  return "https://accounts.spotify.com/authorize?" + params.toString();
}

/** Fetch Spotify artist stats using a valid access token + artist ID. */
export async function fetchSpotifyStats(
  accessToken: string,
  artistId: string
): Promise<SpotifyStats | null> {
  try {
    const headers = { Authorization: "Bearer " + accessToken };

    const [artistRes, tracksRes, albumsRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/artists/" + artistId, { headers }),
      fetch("https://api.spotify.com/v1/artists/" + artistId + "/top-tracks?market=AE", { headers }),
      fetch("https://api.spotify.com/v1/artists/" + artistId + "/albums?limit=4&include_groups=album,single&market=AE", { headers }),
    ]);

    if (!artistRes.ok) return null;

    const artist = await artistRes.json() as {
      name: string; followers: { total: number }; popularity: number;
    };
    const tracksData = tracksRes.ok ? await tracksRes.json() as {
      tracks: { name: string; popularity: number; album: { name: string }; preview_url: string | null }[]
    } : { tracks: [] };
    const albumsData = albumsRes.ok ? await albumsRes.json() as {
      items: { name: string; release_date: string; images: { url: string }[]; external_urls: { spotify: string } }[]
    } : { items: [] };

    return {
      artistName: artist.name,
      followers: artist.followers.total,
      popularity: artist.popularity,
      topTracks: tracksData.tracks.slice(0, 5).map(t => ({
        name: t.name,
        streams: t.popularity + "% popularity",
        album: t.album.name,
        previewUrl: t.preview_url,
      })),
      recentAlbums: albumsData.items.map(a => ({
        name: a.name,
        releaseDate: a.release_date,
        imageUrl: a.images[0]?.url ?? "",
        spotifyUrl: a.external_urls.spotify,
      })),
    };
  } catch { return null; }
}

/** Store Spotify tokens in localStorage. */
export function saveSpotifyTokens(tokens: { accessToken: string; refreshToken: string; expiresAt: number }): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("emy-spotify-tokens", JSON.stringify(tokens));
}

/** Load Spotify tokens from localStorage. */
export function loadSpotifyTokens(): { accessToken: string; refreshToken: string; expiresAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("emy-spotify-tokens");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Clear Spotify tokens (disconnect). */
export function clearSpotifyTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("emy-spotify-tokens");
  localStorage.removeItem("emy-spotify-pkce");
}

/** Save PKCE verifier temporarily during auth flow. */
export function savePkceVerifier(verifier: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("emy-spotify-pkce", verifier);
}

/** Load PKCE verifier saved during auth flow. */
export function loadPkceVerifier(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("emy-spotify-pkce");
}
