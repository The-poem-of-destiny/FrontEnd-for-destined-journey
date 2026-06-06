import { parse as parseJSON5 } from 'json5';

const DATA_BASE_PATH = `https://testingcf.jsdelivr.net/gh/The-poem-of-destiny/FrontEnd-for-destined-journey@${__APP_VERSION__}/public/assets/data`;

export const loadPredefinedData = async <T>(file_name: string, log_label: string) => {
  try {
    const response = await fetch(`${DATA_BASE_PATH}/${file_name}`);
    if (!response.ok) {
      console.log(`[${log_label}] 未找到预定义数据文件:`, file_name);
      return null;
    }

    const text = await response.text();
    const data = parseJSON5(text) as T;
    console.log(`[${log_label}] 成功加载预定义数据文件:`, file_name);
    return data;
  } catch (error) {
    console.warn(`[${log_label}] 读取预定义数据失败:`, error);
    return null;
  }
};
