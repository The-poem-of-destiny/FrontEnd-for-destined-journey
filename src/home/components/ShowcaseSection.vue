<template>
  <div class="showcase-section">
    <!-- 制作人员展示区 -->
    <div class="credits-container">
      <div class="credits-title">❖ 制作团队 ❖</div>
      <div class="author-badges">
        <span v-for="author in teamMembers" :key="author" class="author-badge">{{ author }}</span>
      </div>
      <div class="credits-title">❖ 英灵殿 ❖</div>
      <div class="author-badges">
        <span v-for="author in hallOfFame" :key="author" class="author-badge">{{ author }}</span>
      </div>
      <div class="credits-special"><strong>特别鸣谢：</strong>{{ specialThanks.join(' ') }}</div>
    </div>

    <!-- 合并后的信息面板 -->
    <details class="info-panel">
      <summary>
        <span>世界背景与相关信息</span>
        <span class="arrow-toggle">❖</span>
      </summary>
      <div class="info-content">
        <h3>阿斯塔利亚世界</h3>
        <p>
          小时候的你读过那样的故事吗？在剑与魔法的异世界中，幻想中的故事。一句澄澈而坚定的誓言，一段英雄的骑行，一页由凡人书写的史诗。
        </p>

        <div class="world-quote">"家园已在身后，世界尽在眼前。"</div>

        <div class="world-quote">
          "长夜将至，我从今开始守望，至死方休。我将不娶妻、不封地、不生子。我将不戴宝冠，不争荣宠。我将尽忠职守，生死于斯。我是黑暗中的利剑，长城上的守卫，抵御寒冷的烈焰，破晓时分的光线，唤醒眠者的号角，守护王国的坚盾。我将生命与荣耀献给守夜人，今夜如此，夜夜皆然。"
        </div>

        <div class="world-quote">
          "荣耀即吾命！"<br />
          "愿黑松长青，愿号角长鸣，愿理想闪耀如初，愿长剑锋利如故。"
        </div>

        <p>
          这里是阿斯塔利亚。"剑与魔法"、"诗与远方"、"历史与传说"、"生者与死者"、"英雄与史诗"、"神灵与命运"的世界。
        </p>
        <p>请拿起你梦中与儿时最浪漫的笔，亲自书写属于你自己的冒险故事吧。</p>

        <div class="update-section">
          <h3>获取最新更新</h3>
          <ul>
            <li>
              <a
                href="https://discord.com/channels/1134557553011998840/1448526819824504882"
                target="_blank"
                rel="noopener noreferrer"
                >更新频道 *脑</a
              >
            </li>
            <li>
              <a
                href="https://discord.com/channels/1291925535324110879/1448533751540879452"
                target="_blank"
                rel="noopener noreferrer"
                >更新频道 *程</a
              >
            </li>
          </ul>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
const teamMembers = [
  '@𝕽𝖍𝖞𝖘_𝖟_瑞',
  '@Yoyo514',
  '@十七',
  '@Hilo',
  '@快乐柠萌茶',
  '@三饺初华',
  '@银时萝',
  '@镜梦幻',
  '@风见幽泠',
  '@lili',
  '@北游',
  '@仰望星空',
  '@K1nn',
  '@AkabaneSaki',
  '@Aoo',
  '@青砚',
];

const hallOfFame = ['@Kitaikuyo', '@秋天的咸鱼'];

const specialThanks = ['@FL已放弃治疗', '@tongtny123', '@肆祀一一', '@大乐'];
</script>

<style scoped>
/* --- Credits & Info Styles --- */

.credits-container {
  text-align: center;
  margin-bottom: 25px;
  padding: 20px;
  background-color: rgba(253, 250, 245, 0.6);
  border-radius: 8px;
  border: 1px dashed var(--border-color);
}

.credits-title {
  font-family: var(--title-font);
  font-weight: 700;
  color: var(--title-color);
  margin-bottom: 15px;
  font-size: 1.2em;
  letter-spacing: 1px;
}

.author-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.author-badge {
  background-color: var(--item-bg-color);
  border: 1px solid var(--border-color);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  color: var(--text-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: default;
}

.author-badge:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong-color);
  background-color: var(--item-bg-hover-color);
}

.credits-special {
  font-size: 0.95em;
  color: #6a514d;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dotted var(--border-color);
  display: inline-block;
  padding-left: 20px;
  padding-right: 20px;
}

/* --- Info Panel Styles --- */
.info-panel {
  margin-bottom: 25px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--item-bg-color);
}

.info-panel > summary {
  font-family: var(--title-font);
  font-weight: 700;
  font-size: 1.1em;
  color: var(--title-color);
  background-color: rgba(253, 250, 245, 0.6);
  padding: 12px 20px;
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.info-panel > summary::-webkit-details-marker {
  display: none;
}

.info-panel > summary:hover {
  background-color: rgba(253, 250, 245, 0.8);
}

.arrow-toggle {
  font-size: 0.8em;
  transition: transform 0.3s ease-out;
  display: inline-block;
}

.info-panel[open] > summary .arrow-toggle {
  transform: rotate(-90deg);
}

.info-content {
  padding: 15px 25px 25px 25px;
  line-height: 1.7;
}

.info-content h3 {
  font-family: var(--title-font);
  color: var(--title-color);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 8px;
  margin: 25px 0 15px 0;
  font-size: 1.4em;
}

.info-content h3:first-child {
  margin-top: 5px;
}

.info-content p,
.info-content ul {
  margin: 0 0 1em 0;
}

.info-content ul {
  list-style: none;
  padding-left: 5px;
}

.info-content li {
  padding-left: 20px;
  position: relative;
}

.info-content li::before {
  content: '»';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--border-strong-color);
  font-weight: bold;
}

.info-content a {
  color: var(--link-color);
  text-decoration: none;
  font-weight: 500;
  word-break: break-all;
}

.info-content a:hover {
  text-decoration: underline;
  color: var(--title-color);
}

.world-quote {
  background-color: rgba(245, 239, 230, 0.5);
  border-left: 3px solid var(--border-strong-color);
  padding: 12px 18px;
  margin: 15px 0;
  font-style: italic;
  color: #5d4037;
  font-family: 'KaiTi', 'STKaiti', '楷体', var(--body-font);
  line-height: 1.6;
}

.update-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);
}

/* Responsive */
@media screen and (max-width: 600px) {
  .info-panel > summary {
    padding: 10px 15px;
  }

  .info-content {
    padding: 15px;
  }
}
</style>
