import { ExternalImageEntry, getAllowedExternalImageEntries } from './external-image';
import { loadPredefinedData } from './predefined-data';

export type PartnerGalleryItem = ExternalImageEntry;

let predefinedPartnerGalleryMapPromise: Promise<Record<string, PartnerGalleryItem[]>> | null = null;

const getChatPartnerGalleryMap = (partner_names: string[]) => {
  if (partner_names.length === 0) {
    return {};
  }

  try {
    const chatVariables = getVariables({ type: 'chat' });
    console.log('[PartnerGallery] 开始读取 chat 伙伴图片:', partner_names);

    return partner_names.reduce<Record<string, PartnerGalleryItem[]>>((result, partner_name) => {
      const galleryItems = getAllowedExternalImageEntries(
        _.get(chatVariables, ['status', 'externalGalleries', 'partners', partner_name, 'images']),
      );

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

    return _.mapValues(data, getAllowedExternalImageEntries);
  })();

  return predefinedPartnerGalleryMapPromise;
};

export const getDefaultPartnerGalleryMap = async (partner_names: string[]) => {
  if (partner_names.length === 0) {
    return {};
  }

  const result = getChatPartnerGalleryMap(partner_names);
  const predefinedGalleryPartnerNames = partner_names.filter(partner_name => !result[partner_name]);

  if (predefinedGalleryPartnerNames.length === 0) {
    return result;
  }

  const predefinedPartnerGalleryMap = await loadPredefinedPartnerGalleryMap();

  return predefinedGalleryPartnerNames.reduce<Record<string, PartnerGalleryItem[]>>(
    (result, partner_name) => {
      const galleryItems = predefinedPartnerGalleryMap[partner_name] ?? [];
      if (galleryItems.length > 0) {
        result[partner_name] = galleryItems;
      }

      return result;
    },
    result,
  );
};
