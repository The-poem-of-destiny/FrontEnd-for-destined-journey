import { getAllowedExternalImageUrl } from './external-image';
import { loadPredefinedData } from './predefined-data';

let predefinedPartnerAvatarMapPromise: Promise<Record<string, string>> | null = null;

const getChatPartnerAvatarUrl = (partner_name: string) => {
  try {
    const chatVariables = getVariables({ type: 'chat' });
    const avatarUrl = _.get(chatVariables, [
      'status',
      'externalAvatars',
      'partners',
      partner_name,
      'url',
    ]);

    return getAllowedExternalImageUrl(avatarUrl);
  } catch (error) {
    console.warn('[PartnerAvatar] 读取聊天变量伙伴头像失败:', error);
    return '';
  }
};

const getChatPartnerAvatarMap = (partner_names: string[]) => {
  if (partner_names.length === 0) {
    return {};
  }

  try {
    const chatVariables = getVariables({ type: 'chat' });
    console.log('[PartnerAvatar] 开始读取 chat 伙伴头像:', partner_names);

    return partner_names.reduce<Record<string, string>>((result, partner_name) => {
      const avatarUrl = _.get(chatVariables, [
        'status',
        'externalAvatars',
        'partners',
        partner_name,
        'url',
      ]);
      const allowedAvatarUrl = getAllowedExternalImageUrl(avatarUrl);

      if (allowedAvatarUrl) {
        console.log('[PartnerAvatar] 命中 chat 伙伴头像:', partner_name, allowedAvatarUrl);
        result[partner_name] = allowedAvatarUrl;
      }

      return result;
    }, {});
  } catch (error) {
    console.warn('[PartnerAvatar] 读取聊天变量伙伴头像失败:', error);
    return {};
  }
};

const loadPredefinedPartnerAvatarMap = () => {
  if (predefinedPartnerAvatarMapPromise) {
    return predefinedPartnerAvatarMapPromise;
  }

  predefinedPartnerAvatarMapPromise = (async () => {
    const data = await loadPredefinedData<Record<string, string>>(
      'predefined-avatars.json',
      'PartnerAvatar',
    );
    return data ?? {};
  })();

  return predefinedPartnerAvatarMapPromise;
};

const getPredefinedPartnerAvatarUrl = (
  predefinedPartnerAvatarMap: Record<string, string>,
  partner_name: string,
) => {
  return getAllowedExternalImageUrl(predefinedPartnerAvatarMap[partner_name]);
};

export const getDefaultPartnerAvatarUrl = async (partner_name: string) => {
  const chatPartnerAvatarUrl = getChatPartnerAvatarUrl(partner_name);
  if (chatPartnerAvatarUrl) {
    return chatPartnerAvatarUrl;
  }

  const predefinedPartnerAvatarMap = await loadPredefinedPartnerAvatarMap();
  return getPredefinedPartnerAvatarUrl(predefinedPartnerAvatarMap, partner_name);
};

export const getDefaultPartnerAvatarMap = async (partner_names: string[]) => {
  const result = getChatPartnerAvatarMap(partner_names);
  const predefinedAvatarPartnerNames = partner_names.filter(partner_name => !result[partner_name]);

  if (predefinedAvatarPartnerNames.length === 0) {
    return result;
  }

  const predefinedPartnerAvatarMap = await loadPredefinedPartnerAvatarMap();

  predefinedAvatarPartnerNames.forEach(partner_name => {
    const predefinedAvatarUrl = getPredefinedPartnerAvatarUrl(
      predefinedPartnerAvatarMap,
      partner_name,
    );
    if (predefinedAvatarUrl) {
      console.log('[PartnerAvatar] 命中预定义伙伴头像:', partner_name, predefinedAvatarUrl);
      result[partner_name] = predefinedAvatarUrl;
    }
  });

  return result;
};
