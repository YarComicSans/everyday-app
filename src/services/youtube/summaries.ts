import { YTNodes, type YT } from 'youtubei.js';

import type { VideoSummary } from './types';

/** A search result row → VideoSummary. */
export function fromVideoNode(node: YTNodes.Video): VideoSummary {
  return {
    id: node.video_id,
    title: node.title.toString(),
    channel: node.author.name,
    durationSeconds: node.duration.seconds || 0,
    thumbnailUrl: node.thumbnails[0]?.url ?? '',
    ...labels(node.short_view_count?.toString() || node.view_count?.toString(), node.published?.toString()),
  };
}

/** The Video being watched → VideoSummary. */
export function fromVideoInfo(info: YT.VideoInfo): VideoSummary {
  const basic = info.basic_info;
  const views = info.primary_info?.view_count;
  return {
    id: basic.id ?? '',
    title: basic.title ?? '',
    channel: basic.author ?? '',
    durationSeconds: basic.is_live ? 0 : (basic.duration ?? 0),
    thumbnailUrl: basic.thumbnail?.[0]?.url ?? '',
    ...labels(
      views?.short_view_count?.toString() ||
        views?.extra_short_view_count?.toString() ||
        views?.view_count?.toString(),
      info.primary_info?.relative_date?.toString(),
    ),
  };
}

/** The Related Videos in a watch-next feed; anything that isn't a Video is dropped. */
export function relatedVideos(info: YT.VideoInfo, currentId: string): VideoSummary[] {
  const related: VideoSummary[] = [];
  for (const node of info.watch_next_feed ?? []) {
    const video = node.is(YTNodes.LockupView) ? fromLockup(node) : null;
    if (video && video.id !== currentId) related.push(video);
  }
  return related;
}

function fromLockup(node: YTNodes.LockupView): VideoSummary | null {
  if (node.content_type !== 'VIDEO' || !node.content_id) return null;
  // Rows: [channel], [views, age]
  const rows = node.metadata?.metadata?.metadata_rows ?? [];
  const part = (row: number, index: number) =>
    rows[row]?.metadata_parts?.[index]?.text?.toString() || undefined;
  const image = node.content_image?.is(YTNodes.ThumbnailView) ? node.content_image.image : [];
  return {
    id: node.content_id,
    title: node.metadata?.title?.toString() ?? '',
    channel: part(0, 0) ?? '',
    durationSeconds: node.duration.seconds || 0,
    thumbnailUrl: image[0]?.url ?? '',
    ...labels(part(1, 0), part(1, 1)),
  };
}

function labels(views: string | undefined, published: string | undefined) {
  const result: Pick<VideoSummary, 'viewsLabel' | 'publishedLabel'> = {};
  // Compact counts come bare ("58M"); live counts already say "watching".
  if (views) result.viewsLabel = /^[\d.,]+\s*[KMB]?$/i.test(views) ? `${views} views` : views;
  if (published) result.publishedLabel = published;
  return result;
}
