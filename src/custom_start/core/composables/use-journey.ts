/**
 * 旅程执行 Composable
 * 处理角色数据提交和 AI 交互
 */
import { storeToRefs } from 'pinia';

import { useCharacterStore, useCustomContentStore } from '../store';
import { generateAIPrompt, writeCharacterToMvu } from '../utils/data-exporter';

interface UseJourneyReturn {
  /** 执行踏上旅程 */
  executeJourney: (options?: ExecuteJourneyOptions) => Promise<void>;
}

export interface ExecuteJourneyOptions {
  autoTrigger?: boolean;
}

const getLatestMessageId = () => {
  const latestMessage = getChatMessages(-1, { include_swipes: false })[0];
  return latestMessage?.message_id ?? getLastMessageId();
};

/**
 * 使用旅程执行
 */
export function useJourney(): UseJourneyReturn {
  const characterStore = useCharacterStore();
  const customContentStore = useCustomContentStore();
  const { character } = storeToRefs(characterStore);

  const executeJourney = async (options: ExecuteJourneyOptions = {}) => {
    const { autoTrigger = true } = options;

    try {
      // 1. 生成 AI 提示词
      const aiPrompt = generateAIPrompt(
        character.value,
        characterStore.selectedEquipments,
        characterStore.selectedPartners,
        characterStore.selectedBackground,
        characterStore.selectedItems,
        characterStore.selectedSkills,
        customContentStore.customBackgroundDescription,
        characterStore.journeyOptions,
      );
      console.log('✅ AI 提示词已生成：\n', aiPrompt);

      // 2. 创建用户消息楼层（使用 createChatMessages 函数，避免 slash 命令解析问题）
      await createChatMessages([{ role: 'user', message: aiPrompt }]);
      const messageId = getLatestMessageId();
      console.log(`✅ 角色信息已写入第 ${messageId} 楼`);

      // 3. 直接把变量插入新创建的用户消息楼层
      await writeCharacterToMvu(
        character.value,
        characterStore.selectedItems,
        characterStore.selectedSkills,
        characterStore.selectedPartners,
        characterStore.selectedEquipments,
        characterStore.journeyOptions,
        messageId,
      );

      console.log(`✅ 角色数据已写入第 ${messageId} 楼变量`);

      if (autoTrigger) {
        // 4. 触发 AI 回复
        await triggerSlash('/trigger');
      } else {
        toastr.info('已创建开局消息，等待你手动继续');
      }
    } catch (error) {
      console.error('❌ 踏上旅程时发生错误：', error);
    }
  };

  return {
    executeJourney,
  };
}
