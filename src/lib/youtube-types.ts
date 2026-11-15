export type YouTubeVideo = {
  id: string;
  title: string;
  viewCount: number;
  publishedAt: string;
  duration: string;
  thumbUrl: string;
};

export type ChannelBundle = {
  handle: string;
  channelId: string;
  title: string;
  description?: string;
  subscriberCount?: number;
  thumbnailUrl?: string;
  videos: YouTubeVideo[];
};