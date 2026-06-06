import { parse as parseJSON5 } from 'json5';

const DATA_BASE_PATH = `https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey@${__APP_VERSION__}/public/assets/data`;

let predefinedPartnerAvatarMapPromise: Promise<Record<string, string>> | null = null;

const ExternalAvatarHostAllowList = ['files.catbox.moe', 'i.ibb.co', 'wsrv.nl'];
const ExternalAvatarExtensionAllowList = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

const getAllowedExternalAvatarUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    if (value !== undefined && value !== null) {
      console.log('[ExternalAvatar] 忽略非字符串头像 URL:', value);
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
      console.log('[ExternalAvatar] 忽略非 https 头像 URL:', normalizedValue);
      return '';
    }

    if (!ExternalAvatarHostAllowList.includes(url.hostname.toLowerCase())) {
      console.log('[ExternalAvatar] 忽略非白名单头像域名:', normalizedValue);
      return '';
    }

    const pathname = url.pathname.toLowerCase();
    const hasAllowedExtension = ExternalAvatarExtensionAllowList.some(extension =>
      pathname.endsWith(extension),
    );

    if (!hasAllowedExtension) {
      console.log('[ExternalAvatar] 忽略非白名单头像扩展名:', normalizedValue);
      return '';
    }

    return normalizedValue;
  } catch {
    return '';
  }
};

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

    return getAllowedExternalAvatarUrl(avatarUrl);
  } catch (error) {
    console.warn('[ExternalAvatar] 读取聊天变量伙伴头像失败:', error);
    return '';
  }
};

const getChatPartnerAvatarMap = (partner_names: string[]) => {
  if (partner_names.length === 0) {
    return {};
  }

  try {
    const chatVariables = getVariables({ type: 'chat' });
    console.log('[ExternalAvatar] 开始读取 chat 伙伴头像:', partner_names);

    return partner_names.reduce<Record<string, string>>((result, partner_name) => {
      const avatarUrl = _.get(chatVariables, [
        'status',
        'externalAvatars',
        'partners',
        partner_name,
        'url',
      ]);
      const allowedAvatarUrl = getAllowedExternalAvatarUrl(avatarUrl);

      if (allowedAvatarUrl) {
        console.log('[ExternalAvatar] 命中 chat 伙伴头像:', partner_name, allowedAvatarUrl);
        result[partner_name] = allowedAvatarUrl;
      }

      return result;
    }, {});
  } catch (error) {
    console.warn('[ExternalAvatar] 读取聊天变量伙伴头像失败:', error);
    return {};
  }
};

const loadPredefinedPartnerAvatarMap = () => {
  if (predefinedPartnerAvatarMapPromise) {
    return predefinedPartnerAvatarMapPromise;
  }

  predefinedPartnerAvatarMapPromise = (async () => {
    try {
      const response = await fetch(`${DATA_BASE_PATH}/predefined-avatars.json`);
      if (!response.ok) {
        console.log('[ExternalAvatar] 未找到预定义伙伴头像文件');
        return {};
      }

      const text = await response.text();
      const data = parseJSON5(text) as Record<string, string>;
      console.log('[ExternalAvatar] 成功加载预定义伙伴头像');
      return data;
    } catch (error) {
      console.warn('[ExternalAvatar] 读取预定义伙伴头像失败:', error);
      return {};
    }
  })();

  return predefinedPartnerAvatarMapPromise;
};

const getPredefinedPartnerAvatarUrl = (
  predefinedPartnerAvatarMap: Record<string, string>,
  partner_name: string,
) => {
  return getAllowedExternalAvatarUrl(predefinedPartnerAvatarMap[partner_name]);
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
      console.log('[ExternalAvatar] 命中预定义伙伴头像:', partner_name, predefinedAvatarUrl);
      result[partner_name] = predefinedAvatarUrl;
    }
  });

  return result;
};
