/**
 * 旅程执行 Composable
 * 处理角色数据提交和 AI 交互
 */
import { storeToRefs } from 'pinia';

import { useCharacterStore, useCustomContentStore } from '../store';
import { generateAIPrompt, writeCharacterToMvu } from '../utils/data-exporter';

interface UseJourneyReturn {
  /** 执行踏上旅程 */
  executeJourney: () => Promise<void>;
}

/**
 * 使用旅程执行
 */
export function useJourney(): UseJourneyReturn {
  const characterStore = useCharacterStore();
  const customContentStore = useCustomContentStore();
  const { character } = storeToRefs(characterStore);

  const executeJourney = async () => {
    try {
      // 1. 写入 MVU 变量
      await writeCharacterToMvu(
        character.value,
        characterStore.selectedEquipments,
        characterStore.selectedItems,
        characterStore.selectedSkills,
        characterStore.selectedPartners,
      );
      console.log('✅ 角色数据已写入 MVU 变量');

      // 2. 生成 AI 提示词
      const aiPrompt = generateAIPrompt(
        character.value,
        characterStore.selectedBackground,
        customContentStore.customBackgroundDescription,
      );
      console.log('✅ AI 提示词已生成：\n', aiPrompt);

      // 3. 发送给 AI（使用 createChatMessages 函数，避免 slash 命令解析问题）
      await createChatMessages([{ role: 'user', message: aiPrompt }]);

      console.log('✅ 角色信息已发送给 AI');

      // 4. 触发 AI 回复
      await triggerSlash('/trigger');
    } catch (error) {
      console.error('❌ 踏上旅程时发生错误：', error);
    }
  };

  return {
    executeJourney,
  };
}
