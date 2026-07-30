/**
 * 场景列表配置
 */
export const scenarios = [
  { index: 1, label: '我的故事将由我亲手书写' },
  { index: 2, label: '《线与天堂与彼岸花》' },
];

/**
 * 切换场景（Swipe）
 */
export async function switchSwipe(swipeId: number): Promise<boolean> {
  if (typeof SillyTavern === 'undefined' || !SillyTavern.chat || SillyTavern.chat.length === 0) {
    console.warn('SillyTavern environment not detected. Action will not be executed.');
    return false;
  }

  const swipeIndex = swipeId;

  if (
    typeof SillyTavern.chat[0].swipe_id !== 'undefined' &&
    SillyTavern.chat[0].swipe_id !== swipeIndex
  ) {
    if (SillyTavern.chat[0].swipes && SillyTavern.chat[0].swipes.length > swipeIndex) {
      SillyTavern.chat[0].swipe_id = swipeIndex;
      SillyTavern.chat[0].mes = SillyTavern.chat[0].swipes[swipeIndex];
      await SillyTavern.saveChat();
      await SillyTavern.reloadCurrentChat();
      console.log(`Successfully switched to scenario (swipe_id: ${swipeIndex}).`);
      return true;
    } else {
      console.error(`Swipe index ${swipeIndex} is out of bounds or swipes array is missing.`);
      return false;
    }
  } else {
    console.log(`Scenario ${swipeIndex} is already selected or swipe data is unavailable.`);
    return true;
  }
}
