const ExternalImageHostAllowList = ['files.catbox.moe', 'i.ibb.co', 'wsrv.nl'];
const ExternalImageExtensionAllowList = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

export interface ExternalImageEntry {
  url: string;
  title: string;
}

export const getAllowedExternalImageUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    if (value !== undefined && value !== null) {
      console.log('[ExternalImage] 忽略非字符串图片 URL:', value);
    }
    return '';
  }

  const normalizedValue = _.trim(value);
  if (!normalizedValue) {
    return '';
  }

  try {
    const url = new URL(normalizedValue);
    if (url.protocol !== 'https:') {
      console.log('[ExternalImage] 忽略非 https 图片 URL:', normalizedValue);
      return '';
    }

    if (!ExternalImageHostAllowList.includes(url.hostname.toLowerCase())) {
      console.log('[ExternalImage] 忽略非白名单图片域名:', normalizedValue);
      return '';
    }

    const pathname = url.pathname.toLowerCase();
    const hasAllowedExtension = ExternalImageExtensionAllowList.some(extension =>
      pathname.endsWith(extension),
    );

    if (!hasAllowedExtension) {
      console.log('[ExternalImage] 忽略非白名单图片扩展名:', normalizedValue);
      return '';
    }

    return normalizedValue;
  } catch {
    return '';
  }
};

export const getAllowedExternalImageEntry = (value: unknown): ExternalImageEntry | null => {
  if (!_.isPlainObject(value)) {
    if (value !== undefined && value !== null) {
      console.log('[ExternalImage] 忽略非对象图片条目:', value);
    }
    return null;
  }

  const titleValue = _.get(value, 'title');
  const title = typeof titleValue === 'string' ? _.trim(titleValue) : '';
  if (!title) {
    console.log('[ExternalImage] 忽略缺少 title 的图片条目:', value);
    return null;
  }

  const url = getAllowedExternalImageUrl(_.get(value, 'url'));
  if (!url) {
    return null;
  }

  return { url, title };
};

export const getAllowedExternalImageEntries = (value: unknown): ExternalImageEntry[] => {
  if (!Array.isArray(value)) {
    if (value !== undefined && value !== null) {
      console.log('[ExternalImage] 忽略非数组图片条目列表:', value);
    }
    return [];
  }

  const entries = value.map(getAllowedExternalImageEntry);
  return entries.filter((entry): entry is ExternalImageEntry => Boolean(entry));
};
