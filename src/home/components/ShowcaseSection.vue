<template>
  <div class="showcase-section">
    <!-- 制作人员展示区 -->
    <div class="credits-container">
      <div class="credits-title">❖ 制作团队 ❖</div>
      <div class="author-badges">
        <span v-for="author in teamMembers" :key="author" class="author-badge">{{ author }}</span>
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
          在海并非海的虚空深处，诸神以言辞与火铸成尘世<br />那时，最古的龙尚未沉眠，星辰尚未坠落。神明行走于山巅、林冠与潮声之间，将律法钉入大地，将生命赐予泥土
        </p>

        <p>
          长耳者在永绿之梦中聆听树心；白翼者于高天筑城，奉光为冠；兽群学会火与歌，向祖灵献上鲜血；人类在短促的寿命里垒起王座、城墙与文明<br />铁被锻成王权，麦穗被称作丰饶，金币被赋予重量，名字被写入石碑<br />凡世由此昌盛，也由此生出腐朽
        </p>

        <p>
          直到星轨偏移，虚海涨潮<br />门在无门之处开启。裂光从平原、海底与云层深处刺入此世，非此世之物循光而来。披圣辉者、负深渊者、以死亡筑国者、被称作神的异物，俯身窥视这方世界
        </p>

        <p>
          诸王折剑，圣者失声<br />群山之上响起龙的怒吼，人类举起残破的战旗，白翼于神迹下编织穹律，草原的子嗣以血盟守住西风，海中与山下的古民也献出自己的锋刃<br />有神被斩落<br />神血浸透群山<br />有国被抹去<br />连废墟也被风沙吞没<br />有英雄的名字，只剩墓前低声的悼念<br />最终，天穹被缝合，裂隙被钉入地底，群星重新归位
        </p>

        <p>交汇之祸被按入大地。人们称那一日为战争的终结</p>

        <p>
          古龙在火山与冰原之间闭目；神座高悬，回应日渐稀薄；破碎的圣律天穹化作泣空遗迹，十三座空岛至今悬在云海之上<br />那些听见异世低语的人，仍在无灯之处俯首，把血滴进陌生的纹章里
        </p>

        <p>岁月在伤口上长出城邦、王冠与市集<br />复兴纪元四百八十八年，凡世仍在运转</p>

        <p>
          双头狮鹫张开铁翼，白金拱桥横跨天穹，铁律与冠冕支撑着帝国的荣光；西风草原的战斧在鞍侧低鸣，篝火旁的歌声从未忘记边境的血债<br />南海诸城灯火长明，黄金、欢愉与罪恶同潮水流转；北境的铁冠迎风燃烧，长垣之外，白霜一次次叩门<br />圣山之巅，白翼看守金杯，称世间为污浊；翡翠林海重开幽径，沉默的子民再度踏上远路
        </p>

        <div class="world-quote">
          听吧，旅人<br />
          听那虚海边缘未息的暗潮，听那古老战场低泣的晚风<br />
          星轨已现，航路未明<br />
          旧日英雄归于石碑，新生之子未识敬畏；以念为引，聚沙成塔
        </div>

        <div class="world-quote">
          去吧，旅人<br />
          越过北境长垣不化的冰雪，穿过西风草原无尽的黄沙<br />
          裂隙将启，神座空悬<br />
          昔时圣域沦为废墟，迷途之徒难辨前路；以世为书，执剑作笔
        </div>

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
          </ul>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
const teamMembers = [
  'Rhys_z_瑞',
  'Yoyo514',
  '快乐柠萌茶',
  'Hilo(404/403)',
  '十七',
  '三饺初华',
  '银时萝',
  '镜梦幻',
  '风见幽泠',
  'lili',
  '北游',
  '仰望星空',
  'K1nn',
  'AkabaneSaki',
  'Aoo',
  '青砚',
  'Elfa',
];

const specialThanks = ['FL已放弃治疗', 'tongtny123', '肆祀一一', '大乐', 'Kitaikuyo', '秋天的咸鱼'];
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
