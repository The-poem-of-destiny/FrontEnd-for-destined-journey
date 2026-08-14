/**
 * 环境状态初始值
 */
export const initialEnvStatus = {
  tavernHelper: {
    version: null as string | null,
    status: 'unknown',
    statusText: '加载中...',
  },
  ejsTemplate: {
    status: 'unknown',
    statusText: '加载中...',
    enabledStatus: 'unknown',
    enabledText: '加载中...',
  },
  mvu: {
    status: 'unknown',
    statusText: '加载中...',
  },
  allOk: false,
};

/**
 * 版本比较工具
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersion(v1: string | null, v2: string): number {
  if (!v1 || !v2) return -1;
  const s1 = String(v1);
  const s2 = String(v2);
  const arr1 = s1.split('.').map(Number);
  const arr2 = s2.split('.').map(Number);
  const len = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < len; i++) {
    const num1 = arr1[i] || 0;
    const num2 = arr2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
//检查酒馆助手
export function checkTavernHelper() {
  const version = getTavernHelperVersion();

  if (!version) {
    return {
      version: null,
      status: 'error',
      statusText: '未找到',
    };
  }

  const isVersionOk = compareVersion(version, '4.8.19') >= 0;

  return {
    version,
    status: isVersionOk ? 'ok' : 'warn',
    statusText: isVersionOk ? '正常' : '版本过低',
  };
}
//检查ejs
export function checkEjsTemplate() {
  try {
    const context = window.top?.SillyTavern.getContext();
    const ejsTemplateSettings = context.extensionSettings.EjsTemplate;

    if (!ejsTemplateSettings) {
      return {
        status: 'error',
        statusText: '未检测到',
        enabled: false,
        enabledStatus: 'unknown',
        enabledText: '---',
      };
    }

    return {
      status: 'ok',
      statusText: '存在',
      enabled: ejsTemplateSettings.enabled,
      enabledStatus: ejsTemplateSettings.enabled ? 'ok' : 'warn',
      enabledText: ejsTemplateSettings.enabled ? '已启用' : '未启用',
    };
  } catch (e) {
    return {
      status: 'error',
      statusText: '无法访问',
      enabled: false,
      enabledStatus: 'unknown',
      enabledText: '---',
    };
  }
}
//检查mvu
export async function checkMvu() {
  const timeoutDuration = 3000;
  let timeoutId;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('timed out'));
      }, timeoutDuration);
    });

    await Promise.race([waitGlobalInitialized('Mvu'), timeoutPromise]);

    clearTimeout(timeoutId);

    return { status: 'ok', statusText: '正常' };
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    return { status: 'error', statusText: '异常/超时' };
  }
}
//执行完整环境检查
export async function performFullEnvCheck() {
  const tavernHelper = checkTavernHelper();
  const ejsTemplate = checkEjsTemplate();
  const mvu = await checkMvu();

  const allOk =
    tavernHelper.status === 'ok' &&
    ejsTemplate.status === 'ok' &&
    ejsTemplate.enabledStatus === 'ok' &&
    mvu.status === 'ok';

  return {
    tavernHelper,
    ejsTemplate,
    mvu,
    allOk,
  };
}
