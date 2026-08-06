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
