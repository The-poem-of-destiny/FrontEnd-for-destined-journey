const WSRV_HOST_PATTERN = /^https?:\/\/(?:[^/]+\.)?wsrv\.nl\//i;
const HTTP_URL_PATTERN = /^https?:\/\//i;

/**
 * 渲染阶段统一为地图标记图片接入 wsrv 代理，保持存储层仍使用原始外链。
 * 当前版本只做最保守的 URL 包装；如果后续需要进一步降流量，
 * 可以按缩略图/主图分别追加 w、h、fit、output 等参数。
 */
export const buildMarkerImageUrl = (url: string): string => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl || !HTTP_URL_PATTERN.test(trimmedUrl) || WSRV_HOST_PATTERN.test(trimmedUrl)) {
    return url;
  }

  const normalizedUrl = trimmedUrl.replace(HTTP_URL_PATTERN, '');
  return `https://wsrv.nl/?url=${encodeURIComponent(normalizedUrl)}`;
};
