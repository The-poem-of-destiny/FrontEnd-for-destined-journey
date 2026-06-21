import {
  ExternalImageEntry,
  getAllowedExternalImageEntries,
  getAllowedExternalImageUrl,
} from './external-image';
import { loadPredefinedData } from './predefined-data';

export interface PartnerGalleryItem extends ExternalImageEntry {
  id: string;
}

const DataImagePattern = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

let predefinedPartnerGalleryMapPromise: Promise<Record<string, PartnerGalleryItem[]>> | null = null;

export const createPartnerGalleryItem = (item: ExternalImageEntry): PartnerGalleryItem => ({
  ...item,
  id:
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
});

const getAllowedPartnerGalleryUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = _.trim(value);
  if (!normalizedValue) {
    return '';
  }

  if (DataImagePattern.test(normalizedValue)) {
    return normalizedValue;
  }

  return getAllowedExternalImageUrl(normalizedValue);
};

export const getAllowedPartnerGalleryItem = (value: unknown): PartnerGalleryItem | null => {
  if (!_.isPlainObject(value)) {
    return null;
  }

  const idValue = _.get(value, 'id');
  const id = typeof idValue === 'string' ? _.trim(idValue) : '';
  const titleValue = _.get(value, 'title');
  const title = typeof titleValue === 'string' ? _.trim(titleValue) : '';
  const url = getAllowedPartnerGalleryUrl(_.get(value, 'url'));

  if (!id || !title || !url) {
    return null;
  }

  return { id, title, url };
};

export const getAllowedPartnerGalleryItems = (value: unknown): PartnerGalleryItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const items = value.map(getAllowedPartnerGalleryItem);
  return items.filter((item): item is PartnerGalleryItem => Boolean(item));
};

export const getChatPartnerGalleryMap = (partner_names: string[]) => {
  if (partner_names.length === 0) {
    return {};
  }

  try {
    const chatVariables = getVariables({ type: 'chat' });
    console.log('[PartnerGallery] 开始读取 chat 伙伴图片:', partner_names);

    return partner_names.reduce<Record<string, PartnerGalleryItem[]>>((result, partner_name) => {
      const galleryItems = getAllowedExternalImageEntries(
        _.get(chatVariables, ['status', 'externalGalleries', 'partners', partner_name, 'images']),
      ).map(createPartnerGalleryItem);

      if (galleryItems.length > 0) {
        console.log('[PartnerGallery] 命中 chat 伙伴图片:', partner_name, galleryItems);
        result[partner_name] = galleryItems;
      }

      return result;
    }, {});
  } catch (error) {
    console.warn('[PartnerGallery] 读取聊天变量伙伴图片失败:', error);
    return {};
  }
};

const loadPredefinedPartnerGalleryMap = () => {
  if (predefinedPartnerGalleryMapPromise) {
    return predefinedPartnerGalleryMapPromise;
  }

  predefinedPartnerGalleryMapPromise = (async () => {
    const data = await loadPredefinedData<Record<string, unknown>>(
      'predefined-partner-gallery.json',
      'PartnerGallery',
    );
    if (!data) {
      return {};
    }

    return _.mapValues(data, value =>
      getAllowedExternalImageEntries(value).map(createPartnerGalleryItem),
    );
  })();

  return predefinedPartnerGalleryMapPromise;
};

export const getPredefinedPartnerGalleryMap = async (partner_names: string[]) => {
  if (partner_names.length === 0) {
    return {};
  }

  const predefinedPartnerGalleryMap = await loadPredefinedPartnerGalleryMap();

  return partner_names.reduce<Record<string, PartnerGalleryItem[]>>((result, partner_name) => {
    const galleryItems = predefinedPartnerGalleryMap[partner_name] ?? [];
    if (galleryItems.length > 0) {
      result[partner_name] = galleryItems;
    }

    return result;
  }, {});
};
